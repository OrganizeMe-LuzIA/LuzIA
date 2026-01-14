from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime

from app.repositories.questionarios import QuestionariosRepo
from app.repositories.usuarios import UsuariosRepo
from app.bot.parsers import parse_answer


class BotFlow:
    """
    Controla o estado do usuário e a sequência do questionário.
    Estados: INATIVO, AGUARDANDO_CONFIRMACAO, EM_CURSO, FINALIZADO

    """

    def __init__(self):
        self.users_repo = UsuariosRepo()
        self.q_repo = QuestionariosRepo()

    def _normalize(self, text: str) -> str:
        return (text or "").strip().lower()

    def _intro_message(self) -> str:
        return (
            "Olá! Eu sou o LuzIA\n\n"
            "Vou te enviar um questionário rápido e suas respostas serão armazenadas de forma segura.\n\n"
            "Para começar, responda: SIM"
        )

    def _final_message(self) -> str:
        return "Obrigado! Suas respostas foram registradas com sucesso."

    def _invalid_confirm_message(self) -> str:
        return "Para iniciar o questionário, responda apenas: SIM"

    def _invalid_answer_message(self, min_v: int, max_v: int) -> str:
        return f"Resposta inválida. Envie apenas um número entre {min_v} e {max_v}."

    async def handle_incoming(self, phone: str, incoming_text: str) -> str:
        """Retorna o texto que deve ser enviado ao usuário no WhatsApp"""

        user = await self.users_repo.find_by_phone(phone)

        if not user:
            return "Usuário não cadastrado no sistema. Fale com o administrador."

        chat_state = (user.get("metadata", {}).get("chat_state")) or {}
        status = chat_state.get("statusChat", "INATIVO")
        indice = int(chat_state.get("indicePergunta", 0) or 0)
        id_questionario = chat_state.get("idQuestionario")

        text = self._normalize(incoming_text)

        # Usuário INATIVO
        if status == "INATIVO":
            new_state = {
                "statusChat": "AGUARDANDO_CONFIRMACAO",
                "indicePergunta": 0,
                "idQuestionario": None,
                "dataInicio": None,
            }
            await self.users_repo.update_chat_state(phone, new_state)
            return self._intro_message()

        # Esperando confirmação
        if status == "AGUARDANDO_CONFIRMACAO":
            if text == "sim":
                q = await self.q_repo.get_active_questionnaire()
                if not q:
                    return "Não encontrei um questionário ativo no momento."

                q_id = str(q["_id"])

                new_state = {
                    "statusChat": "EM_CURSO",
                    "indicePergunta": 0,
                    "idQuestionario": q_id,
                    "dataInicio": datetime.utcnow(),
                }
                await self.users_repo.update_chat_state(phone, new_state)

                questions = await self.q_repo.get_questions(q_id)
                if not questions:
                    return "O questionário está ativo, mas não há perguntas cadastradas."

                # Envia a primeira pergunta 
                return questions[0]["texto"]

            return self._invalid_confirm_message()

        # Em curso: valida resposta, salva e manda próxima
        if status == "EM_CURSO":
            if not id_questionario:
                # Estado inconsistente
                await self.users_repo.update_chat_state(phone, {"statusChat": "INATIVO"})
                return self._intro_message()

            questions = await self.q_repo.get_questions(id_questionario)
            if not questions:
                await self.users_repo.update_chat_state(phone, {"statusChat": "INATIVO"})
                return "Não há perguntas cadastradas. Tente novamente mais tarde."

            # caso esteja no fim 
            if indice >= len(questions):
                await self.users_repo.update_chat_state(phone, {"statusChat": "FINALIZADO"})
                return self._final_message()

            current_q = questions[indice]

            valor_parseado = parse_answer(text, multipla=current_q.get("multipla", False))
            if valor_parseado is None:
                if current_q.get("multipla", False):
                    return "Resposta inválida. Envie números de 1 a 5 separados por vírgula. Ex: 1,3,5"
                return "Resposta inválida. Envie apenas um número de 1 a 5."
            
            # salva resposta
            anon_id = user.get("anonId")
            await self.users_repo.push_answer(
                anon_id=anon_id,
                id_questionario=id_questionario,
                id_pergunta=current_q["idPergunta"],
                valor=valor_parseado,  # <- agora pode ser int ou lista[int]
            )

            
            # avança
            next_index = indice + 1

            # acabou?
            if next_index >= len(questions):
                await self.users_repo.update_chat_state(phone, {"statusChat": "FINALIZADO", "indicePergunta": next_index})
                return self._final_message()

            # continua
            await self.users_repo.update_chat_state(phone, {"indicePergunta": next_index})
            next_q = questions[next_index]
            return next_q["texto"]

        # Finalizado (possui brechas para realizar novamente o questionario)
        if status == "FINALIZADO":
            return (
                "Você já finalizou o questionário! \n"
            )

        # fallback
        await self.users_repo.update_chat_state(phone, {"statusChat": "INATIVO"})
        return self._intro_message()
