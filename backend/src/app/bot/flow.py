from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from datetime import datetime

from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.repositories.usuarios import UsuariosRepo
from app.repositories.respostas import RespostasRepo
from app.bot.parsers import parse_answer


LikertValue = Union[int, List[int]]


class BotFlow:
    """Controla o estado do usuário e a sequência do questionário.

    Estados (persistidos em usuarios.metadata.chat_state):
      - INATIVO
      - AGUARDANDO_CONFIRMACAO
      - EM_CURSO
      - FINALIZADO

    Observação: este fluxo é independente do canal (Twilio/HTTP etc.). Os endpoints apenas chamam
    `handle_incoming(phone, incoming_text)` e devolvem o texto retornado.
    """

    def __init__(self):
        self.users_repo = UsuariosRepo()
        self.questionarios_repo = QuestionariosRepo()
        self.perguntas_repo = PerguntasRepo()
        self.respostas_repo = RespostasRepo()

    def _normalize(self, text: str) -> str:
        return (text or "").strip().lower()

    def _intro_message(self) -> str:
        return (
            "Olá! Eu sou o LuzIA\n\n"
            "Vou te enviar um questionário rápido e suas respostas serão armazenadas de forma segura.\n\n"
            "Para começar, responda: SIM\n\n"
            "(Se você quiser recomeçar a qualquer momento, envie: REINICIAR)"
        )

    def _final_message(self) -> str:
        return "Obrigado! Suas respostas foram registradas com sucesso."

    def _invalid_confirm_message(self) -> str:
        return "Para iniciar o questionário, responda apenas: SIM"

    def _invalid_answer_message(self, min_v: int, max_v: int) -> str:
        return f"Resposta inválida. Envie apenas um número entre {min_v} e {max_v}."

    async def _reset_user_chat(self, phone: str) -> None:
        await self.users_repo.update_chat_state(
            phone,
            {
                "statusChat": "INATIVO",
                "indicePergunta": 0,
                "idQuestionario": None,
                "dataInicio": None,
            },
        )

    async def handle_incoming(self, phone: str, incoming_text: str) -> str:
        """Retorna o texto que deve ser enviado ao usuário."""

        user = await self.users_repo.find_by_phone(phone)
        if not user:
            return "Usuário não cadastrado no sistema. Fale com o administrador."

        raw_text = (incoming_text or "").strip()
        text = self._normalize(incoming_text)

        # Comando de reset para desenvolvimento/UX
        if text in {"reiniciar", "recomecar", "recomeçar", "reset"}:
            await self._reset_user_chat(phone)
            return self._intro_message()

        chat_state: Dict[str, Any] = (user.get("metadata") or {}).get("chat_state") or {}
        status: str = chat_state.get("statusChat") or "INATIVO"
        indice: int = int(chat_state.get("indicePergunta") or 0)
        id_questionario: Optional[str] = chat_state.get("idQuestionario")

        # INATIVO -> pede confirmação
        if status == "INATIVO":
            await self.users_repo.update_chat_state(phone, {"statusChat": "AGUARDANDO_CONFIRMACAO"})
            return self._intro_message()

        # Esperando confirmação
        if status == "AGUARDANDO_CONFIRMACAO":
            if text == "sim":
                q = await self.questionarios_repo.get_active_questionnaire()
                if not q:
                    return "Não encontrei um questionário ativo no momento."

                q_id = str(q["_id"])

                await self.users_repo.update_chat_state(
                    phone,
                    {
                        "statusChat": "EM_CURSO",
                        "indicePergunta": 0,
                        "idQuestionario": q_id,
                        "dataInicio": datetime.utcnow(),
                    },
                )

                questions = await self.perguntas_repo.get_questions(q_id)
                if not questions:
                    # volta para inativo para não travar o usuário
                    await self._reset_user_chat(phone)
                    return "O questionário está ativo, mas não há perguntas cadastradas."

                return questions[0].get("texto", "(Pergunta sem texto)")
            return self._invalid_confirm_message()

        # Em curso: valida resposta, salva e manda próxima
        if status == "EM_CURSO":
            if not id_questionario:
                await self._reset_user_chat(phone)
                return self._intro_message()

            questions = await self.perguntas_repo.get_questions(id_questionario)
            if not questions:
                await self._reset_user_chat(phone)
                return "Não há perguntas cadastradas. Tente novamente mais tarde."

            # Caso estado aponte para além do fim
            if indice >= len(questions):
                await self.users_repo.update_chat_state(phone, {"statusChat": "FINALIZADO"})
                return self._final_message()

            current_q = questions[indice]
            tipo_escala = str(current_q.get("tipoEscala") or "")

            if tipo_escala == "texto_livre":
                if not raw_text:
                    return "Resposta inválida. Envie um texto curto."
                if len(raw_text) > 1000:
                    return "Resposta muito longa. Envie no máximo 1000 caracteres."

                anon_id = user.get("anonId")
                if not anon_id:
                    return "Erro de cadastro: usuário sem anonId. Fale com o administrador."

                await self.respostas_repo.push_answer(
                    anon_id=anon_id,
                    id_questionario=id_questionario,
                    id_pergunta=str(current_q.get("idPergunta")),
                    valor=None,
                    valor_texto=raw_text,
                )

                next_index = indice + 1
                if next_index >= len(questions):
                    await self.users_repo.update_chat_state(
                        phone,
                        {"statusChat": "FINALIZADO", "indicePergunta": next_index},
                    )
                    return self._final_message()

                await self.users_repo.update_chat_state(phone, {"indicePergunta": next_index})
                next_q = questions[next_index]
                return next_q.get("texto", "(Pergunta sem texto)")

            # Range (se existir no doc). Caso contrário, padrão 1..5.
            min_v = int(current_q.get("min", 1))
            max_v = int(current_q.get("max", 5))

            # parse: suporta multipla via "1,2,3" se multipla=True
            try:
                valor_parseado: LikertValue = parse_answer(text, multipla=bool(current_q.get("multipla", False)))
            except ValueError:
                # Para múltipla, a mensagem do parser já é 1..5; aqui respeitamos min/max se foram definidos
                return self._invalid_answer_message(min_v, max_v)

            # valida range também para lista
            def _in_range(v: int) -> bool:
                return min_v <= v <= max_v

            if isinstance(valor_parseado, list):
                if not valor_parseado or any(not _in_range(v) for v in valor_parseado):
                    return self._invalid_answer_message(min_v, max_v)
            else:
                if not _in_range(int(valor_parseado)):
                    return self._invalid_answer_message(min_v, max_v)

            # salva resposta
            anon_id = user.get("anonId")
            if not anon_id:
                # fallback: se o cadastro não tem anonId, não conseguimos registrar com consistência
                return "Erro de cadastro: usuário sem anonId. Fale com o administrador."

            await self.respostas_repo.push_answer(
                anon_id=anon_id,
                id_questionario=id_questionario,
                id_pergunta=str(current_q.get("idPergunta")),
                valor=valor_parseado,
            )

            # avança
            next_index = indice + 1

            # acabou?
            if next_index >= len(questions):
                await self.users_repo.update_chat_state(
                    phone,
                    {"statusChat": "FINALIZADO", "indicePergunta": next_index},
                )
                return self._final_message()

            await self.users_repo.update_chat_state(phone, {"indicePergunta": next_index})
            next_q = questions[next_index]
            return next_q.get("texto", "(Pergunta sem texto)")

        # Finalizado
        if status == "FINALIZADO":
            return "Você já finalizou o questionário! Se quiser responder novamente, envie: REINICIAR"

        # fallback
        await self._reset_user_chat(phone)
        return self._intro_message()
