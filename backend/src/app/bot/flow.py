from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from app.repositories.questionarios import QuestionariosRepo, PerguntasRepo
from app.repositories.respostas import RespostasRepo
from app.repositories.usuarios import UsuariosRepo
from app.services.twilio_content_service import TwilioContentService

LikertValue = Union[int, List[int]]


class BotFlow:
    """Controla o estado do usuário e a sequência do questionário."""

    def __init__(self):
        self.users_repo = UsuariosRepo()
        self.questionarios_repo = QuestionariosRepo()
        self.perguntas_repo = PerguntasRepo()
        self.respostas_repo = RespostasRepo()
        self.twilio_service = TwilioContentService()

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

    def _invalid_subpergunta_message(self, total_opcoes: int) -> str:
        if total_opcoes <= 1:
            return "Resposta inválida para sub-pergunta."
        return f"Resposta inválida. Envie o número da opção (1 a {total_opcoes})."

    def _extrair_valor_botao(self, payload: Dict[str, Any]) -> Optional[int]:
        raw = (
            payload.get("listId")
            or payload.get("ListId")
            or payload.get("buttonPayload")
            or payload.get("ButtonPayload")
            or payload.get("id")
        )
        if raw is None:
            return None
        try:
            return int(str(raw).strip())
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _coletar_opcoes(pergunta: Dict[str, Any]) -> List[Dict[str, Any]]:
        opcoes = pergunta.get("opcoesResposta") or []
        normalizadas: List[Dict[str, Any]] = []
        for opcao in opcoes:
            if not isinstance(opcao, dict):
                continue
            if "valor" not in opcao or "texto" not in opcao:
                continue
            normalizadas.append({"valor": int(opcao["valor"]), "texto": str(opcao["texto"]).strip()})
        return normalizadas

    @staticmethod
    def _intervalo_resposta(pergunta: Dict[str, Any], opcoes: List[Dict[str, Any]]) -> tuple[int, int]:
        if opcoes:
            valores = [int(o["valor"]) for o in opcoes]
            return min(valores), max(valores)

        min_v = int(pergunta.get("min", 1))
        max_v = int(pergunta.get("max", 5))
        return min_v, max_v

    @staticmethod
    def _in_range(valor: LikertValue, min_v: int, max_v: int) -> bool:
        if isinstance(valor, list):
            return bool(valor) and all(min_v <= int(v) <= max_v for v in valor)
        return min_v <= int(valor) <= max_v

    @staticmethod
    def _parse_texto(texto: str, multipla: bool, min_v: int, max_v: int) -> Optional[LikertValue]:
        raw = (texto or "").strip()
        if not raw:
            return None

        if not multipla:
            try:
                valor = int(raw)
            except ValueError:
                return None
            return valor if min_v <= valor <= max_v else None

        tokens = [t.strip() for t in raw.replace(";", ",").replace(" ", ",").split(",") if t.strip()]
        if not tokens:
            return None

        valores: List[int] = []
        for token in tokens:
            try:
                n = int(token)
            except ValueError:
                return None
            if n < min_v or n > max_v:
                return None
            if n not in valores:
                valores.append(n)

        if not valores:
            return None
        return valores if len(valores) > 1 else valores[0]

    @staticmethod
    def _formatar_opcoes(opcoes: List[Dict[str, Any]]) -> str:
        linhas: List[str] = []
        for o in opcoes:
            linhas.append(f"{o['valor']} - {o['texto']}")
        return "\n".join(linhas)

    async def _enviar_pergunta_formatada(
        self,
        phone: str,
        pergunta: Dict[str, Any],
        indice: int,
        total: int,
        send_interactive: bool,
    ) -> str:
        texto = str(pergunta.get("texto") or "(Pergunta sem texto)")
        tipo_escala = str(pergunta.get("tipoEscala") or "")
        numero_atual = indice + 1

        if tipo_escala == "texto_livre":
            return f"{numero_atual}/{total} - {texto}"

        opcoes = self._coletar_opcoes(pergunta)

        if send_interactive and opcoes:
            sid = await self.twilio_service.enviar_pergunta_interativa(
                telefone=phone,
                texto_pergunta=texto,
                tipo_escala=tipo_escala,
                opcoes=opcoes,
                numero_atual=numero_atual,
                total=total,
            )
            # Mesmo que a mensagem interativa seja enviada, retornamos o texto
            # como fallback para garantir que o usuário veja a pergunta via TwiML

        base = f"{numero_atual}/{total} - {texto}"
        if not opcoes:
            return base
        return f"{base}\n\n{self._formatar_opcoes(opcoes)}"

    @staticmethod
    def _deve_subpergunta(pergunta: Dict[str, Any], valor: LikertValue) -> bool:
        sub = pergunta.get("subPergunta")
        if not sub:
            return False

        if isinstance(valor, list):
            return any(int(v) > 0 for v in valor)
        return int(valor) > 0

    @staticmethod
    def _build_subpergunta_state(pergunta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        sub = pergunta.get("subPergunta") or {}
        texto = str(sub.get("texto") or "").strip()
        opcoes = sub.get("opcoes") or []
        if not texto or not isinstance(opcoes, list) or not opcoes:
            return None

        return {
            "idPerguntaOrigem": str(pergunta.get("idPergunta") or ""),
            "texto": texto,
            "tipoResposta": str(sub.get("tipoResposta") or "").strip(),
            "opcoes": [str(o).strip() for o in opcoes if str(o).strip()],
        }

    def _formatar_subpergunta(self, sub_state: Dict[str, Any]) -> str:
        texto = sub_state.get("texto", "")
        opcoes = sub_state.get("opcoes") or []
        linhas = [f"{i} - {opcao}" for i, opcao in enumerate(opcoes, start=1)]
        return f"{texto}\n\n" + "\n".join(linhas)

    def _parse_subpergunta(
        self,
        sub_state: Dict[str, Any],
        incoming_text: str,
        button_payload: Optional[Dict[str, Any]],
    ) -> Optional[List[str]]:
        opcoes: List[str] = sub_state.get("opcoes") or []
        if not opcoes:
            return None

        if button_payload:
            escolhido = self._extrair_valor_botao(button_payload)
            if escolhido is None or escolhido < 1 or escolhido > len(opcoes):
                return None
            return [opcoes[escolhido - 1]]

        raw = (incoming_text or "").strip()
        if not raw:
            return None

        tokens = [t.strip() for t in raw.replace(";", ",").replace(" ", ",").split(",") if t.strip()]
        if not tokens:
            return None

        respostas: List[str] = []
        for token in tokens:
            try:
                idx = int(token)
            except ValueError:
                return None
            if idx < 1 or idx > len(opcoes):
                return None
            label = opcoes[idx - 1]
            if label not in respostas:
                respostas.append(label)

        if not respostas:
            return None

        tipo = str(sub_state.get("tipoResposta") or "").lower()
        if tipo != "multipla_escolha" and len(respostas) > 1:
            return None

        return respostas

    async def _save_chat_state(self, phone: str, current_state: Dict[str, Any], **changes: Any) -> Dict[str, Any]:
        new_state = dict(current_state)
        new_state.update(changes)
        await self.users_repo.update_chat_state(phone, new_state)
        return new_state

    async def _reset_user_chat(self, phone: str) -> None:
        await self.users_repo.update_chat_state(
            phone,
            {
                "statusChat": "INATIVO",
                "indicePergunta": 0,
                "idQuestionario": None,
                "dataInicio": None,
                "subPerguntaPendente": None,
            },
        )

    async def handle_incoming(
        self,
        phone: str,
        incoming_text: str,
        button_payload: Optional[Dict[str, Any]] = None,
        send_interactive: bool = False,
    ) -> str:
        """Retorna o texto que deve ser enviado ao usuário."""

        user = await self.users_repo.find_by_phone(phone)
        if not user:
            return "Usuário não cadastrado no sistema. Fale com o administrador."

        raw_text = (incoming_text or "").strip()
        text = self._normalize(incoming_text)

        if text in {"reiniciar", "recomecar", "recomeçar", "reset"}:
            await self._reset_user_chat(phone)
            return self._intro_message()

        chat_state: Dict[str, Any] = (user.get("metadata") or {}).get("chat_state") or {}
        status: str = chat_state.get("statusChat") or "INATIVO"
        indice: int = int(chat_state.get("indicePergunta") or 0)
        id_questionario: Optional[str] = chat_state.get("idQuestionario")

        if status == "INATIVO":
            await self._save_chat_state(phone, chat_state, statusChat="AGUARDANDO_CONFIRMACAO")
            return self._intro_message()

        if status == "AGUARDANDO_CONFIRMACAO":
            if text == "sim":
                q = await self.questionarios_repo.get_active_questionnaire()
                if not q:
                    return "Não encontrei um questionário ativo no momento."

                q_id = str(q["_id"])
                questions = await self.perguntas_repo.get_questions(q_id)
                if not questions:
                    await self._reset_user_chat(phone)
                    return "O questionário está ativo, mas não há perguntas cadastradas."

                await self._save_chat_state(
                    phone,
                    chat_state,
                    statusChat="EM_CURSO",
                    indicePergunta=0,
                    idQuestionario=q_id,
                    dataInicio=datetime.utcnow(),
                    subPerguntaPendente=None,
                )

                return await self._enviar_pergunta_formatada(
                    phone=phone,
                    pergunta=questions[0],
                    indice=0,
                    total=len(questions),
                    send_interactive=send_interactive,
                )

            return self._invalid_confirm_message()

        if status == "EM_CURSO":
            if not id_questionario:
                await self._reset_user_chat(phone)
                return self._intro_message()

            questions = await self.perguntas_repo.get_questions(id_questionario)
            if not questions:
                await self._reset_user_chat(phone)
                return "Não há perguntas cadastradas. Tente novamente mais tarde."

            if indice >= len(questions):
                await self._save_chat_state(phone, chat_state, statusChat="FINALIZADO")
                return self._final_message()

            sub_pendente = chat_state.get("subPerguntaPendente")
            if isinstance(sub_pendente, dict) and sub_pendente:
                respostas_sub = self._parse_subpergunta(sub_pendente, raw_text, button_payload)
                if not respostas_sub:
                    total_opcoes = len(sub_pendente.get("opcoes") or [])
                    return self._invalid_subpergunta_message(total_opcoes)

                anon_id = user.get("anonId")
                if not anon_id:
                    return "Erro de cadastro: usuário sem anonId. Fale com o administrador."

                await self.respostas_repo.push_answer(
                    anon_id=anon_id,
                    id_questionario=id_questionario,
                    id_pergunta=f"{sub_pendente.get('idPerguntaOrigem', 'sub')}__sub",
                    valor_texto=", ".join(respostas_sub),
                )

                next_index = indice + 1
                if next_index >= len(questions):
                    await self._save_chat_state(
                        phone,
                        chat_state,
                        statusChat="FINALIZADO",
                        indicePergunta=next_index,
                        subPerguntaPendente=None,
                    )
                    return self._final_message()

                await self._save_chat_state(
                    phone,
                    chat_state,
                    indicePergunta=next_index,
                    subPerguntaPendente=None,
                )

                next_q = questions[next_index]
                return await self._enviar_pergunta_formatada(
                    phone=phone,
                    pergunta=next_q,
                    indice=next_index,
                    total=len(questions),
                    send_interactive=send_interactive,
                )

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
                    await self._save_chat_state(
                        phone,
                        chat_state,
                        statusChat="FINALIZADO",
                        indicePergunta=next_index,
                    )
                    return self._final_message()

                await self._save_chat_state(phone, chat_state, indicePergunta=next_index)
                next_q = questions[next_index]
                return await self._enviar_pergunta_formatada(
                    phone=phone,
                    pergunta=next_q,
                    indice=next_index,
                    total=len(questions),
                    send_interactive=send_interactive,
                )

            opcoes = self._coletar_opcoes(current_q)
            min_v, max_v = self._intervalo_resposta(current_q, opcoes)
            multipla = bool(current_q.get("multipla", False))

            if button_payload:
                valor_parseado: Optional[LikertValue] = self._extrair_valor_botao(button_payload)
            else:
                valor_parseado = self._parse_texto(raw_text, multipla=multipla, min_v=min_v, max_v=max_v)

            if valor_parseado is None or not self._in_range(valor_parseado, min_v, max_v):
                return self._invalid_answer_message(min_v, max_v)

            anon_id = user.get("anonId")
            if not anon_id:
                return "Erro de cadastro: usuário sem anonId. Fale com o administrador."

            await self.respostas_repo.push_answer(
                anon_id=anon_id,
                id_questionario=id_questionario,
                id_pergunta=str(current_q.get("idPergunta")),
                valor=valor_parseado,
            )

            if self._deve_subpergunta(current_q, valor_parseado):
                sub_state = self._build_subpergunta_state(current_q)
                if sub_state:
                    await self._save_chat_state(phone, chat_state, subPerguntaPendente=sub_state)
                    return self._formatar_subpergunta(sub_state)

            next_index = indice + 1
            if next_index >= len(questions):
                await self._save_chat_state(
                    phone,
                    chat_state,
                    statusChat="FINALIZADO",
                    indicePergunta=next_index,
                )
                return self._final_message()

            await self._save_chat_state(phone, chat_state, indicePergunta=next_index)
            next_q = questions[next_index]
            return await self._enviar_pergunta_formatada(
                phone=phone,
                pergunta=next_q,
                indice=next_index,
                total=len(questions),
                send_interactive=send_interactive,
            )

        if status == "FINALIZADO":
            return "Você já finalizou o questionário! Se quiser responder novamente, envie: REINICIAR"

        await self._reset_user_chat(phone)
        return self._intro_message()
