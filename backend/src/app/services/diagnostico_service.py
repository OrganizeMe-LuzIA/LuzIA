from typing import List, Dict, Any, Tuple
from app.models.base import RespostaItem, Diagnostico, DiagnosticoDimensao
from app.services.copsoq_scoring_service import (
    copsoq_scoring_service,
    ClassificacaoTercil,
)

class DiagnosticoService:
    def _detectar_escala_max(self, respostas: List[RespostaItem]) -> int:
        if not respostas:
            return 4
        return 5 if max(r.valor for r in respostas) > 4 else 4

    def _resultado_global(
        self, dimensoes: List[DiagnosticoDimensao]
    ) -> Tuple[str, float]:
        if not dimensoes:
            return "intermediario", 0.0

        total = len(dimensoes)
        qtd_favoravel = sum(1 for d in dimensoes if d.classificacao == ClassificacaoTercil.FAVORAVEL)
        qtd_risco = sum(1 for d in dimensoes if d.classificacao == ClassificacaoTercil.RISCO)
        qtd_intermediario = total - qtd_favoravel - qtd_risco

        if qtd_risco / total >= 0.5:
            resultado = "risco"
        elif qtd_favoravel / total >= 0.5:
            resultado = "favoravel"
        else:
            resultado = "intermediario"

        pontuacao = ((qtd_risco + (qtd_intermediario * 0.5)) / total) * 4
        return resultado, round(pontuacao, 2)

    def calculate_score(self, respostas: List[RespostaItem], questionario: Dict[str, Any], perguntas: List[Dict[str, Any]]) -> Diagnostico:
        perguntas_map = {p["idPergunta"]: p for p in perguntas}
        codigo_questionario = questionario.get("codigo") or ""
        is_copsoq = isinstance(codigo_questionario, str) and codigo_questionario.startswith("COPSOQ_")
        escala_max = self._detectar_escala_max(respostas)

        domain_scores: Dict[Tuple[str, str, str, str], List[Dict[str, int]]] = {}

        for resp in respostas:
            p = perguntas_map.get(resp.idPergunta)
            if not p:
                continue

            key = (
                p.get("codigoDominio") or p.get("dominio", "sem_dominio"),
                p.get("dominio", "sem_dominio"),
                p.get("dimensao", "sem_dimensao"),
                p.get("sinal") or ("protecao" if copsoq_scoring_service.eh_dimensao_protecao(p.get("dimensao", "")) else "risco"),
            )
            if key not in domain_scores:
                domain_scores[key] = []
            domain_scores[key].append({"id_pergunta": resp.idPergunta, "valor": resp.valor})

        dimensoes_result: List[DiagnosticoDimensao] = []

        for (codigo_dominio, dominio, dimensao, sinal), items in domain_scores.items():
            if is_copsoq:
                resultado = copsoq_scoring_service.processar_dimensao(
                    dimensao=dimensao,
                    dominio=dominio,
                    respostas=items,
                    codigo_questionario=codigo_questionario,
                    escala_max=escala_max,
                )
                pontuacao = resultado.media
                classificacao = resultado.classificacao
                total_itens = resultado.total_itens
                itens_respondidos = resultado.itens_respondidos
            else:
                avg = sum(i["valor"] for i in items) / len(items)
                pontuacao = round(avg, 2)
                if avg <= 2.33:
                    classificacao = ClassificacaoTercil.FAVORAVEL
                elif avg < 3.67:
                    classificacao = ClassificacaoTercil.INTERMEDIARIO
                else:
                    classificacao = ClassificacaoTercil.RISCO
                total_itens = len(items)
                itens_respondidos = len(items)

            dimensoes_result.append(DiagnosticoDimensao(
                dominio=dominio,
                codigoDominio=codigo_dominio,
                dimensao=dimensao,
                pontuacao=pontuacao,
                classificacao=classificacao,
                sinal=sinal,
                total_itens=total_itens,
                itens_respondidos=itens_respondidos,
            ))
        resultado_global, pontuacao_global = self._resultado_global(dimensoes_result)
        
        return Diagnostico(
            anonId="calculated",
            idQuestionario=questionario["_id"],
            resultadoGlobal=resultado_global,
            pontuacaoGlobal=pontuacao_global,
            dimensoes=dimensoes_result
        )
