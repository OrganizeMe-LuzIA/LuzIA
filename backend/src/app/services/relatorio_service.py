from typing import List, Dict, Any
from collections import defaultdict
from app.models.base import (
    Relatorio,
    RelatorioMetricas,
    RelatorioDimensao,
    RelatorioDominio,
)
from app.services.copsoq_scoring_service import (
    copsoq_scoring_service,
    ClassificacaoTercil,
)

class RelatorioService: 
    def _normalize_classificacao(self, valor: Any) -> str:
        if isinstance(valor, ClassificacaoTercil):
            return valor.value
        if hasattr(valor, "value"):
            return str(valor.value)
        return str(valor or ClassificacaoTercil.INTERMEDIARIO.value)

    def _gerar_recomendacoes(self, dominios: List[RelatorioDominio]) -> List[str]:
        mapeamento = {
            "Exigências quantitativas": "Revisar distribuição de carga de trabalho e prioridades.",
            "Apoio social de superiores": "Implementar rotina de feedback e treinamento de liderança.",
            "Conflito trabalho-família": "Reavaliar políticas de jornada e flexibilidade.",
            "Burnout": "Criar plano de prevenção de esgotamento com acompanhamento periódico.",
            "Stress": "Fortalecer ações de gestão de estresse e pausas programadas.",
        }

        recomendacoes: List[str] = []
        for dominio in dominios:
            for dim in dominio.dimensoes:
                if dim.classificacao != ClassificacaoTercil.RISCO:
                    continue
                recomendacao = mapeamento.get(
                    dim.dimensao,
                    f"Priorizar plano de ação para a dimensão '{dim.dimensao}'.",
                )
                if recomendacao not in recomendacoes:
                    recomendacoes.append(recomendacao)
        return recomendacoes or ["Manter monitoramento contínuo das dimensões avaliadas."]

    def generate_relatorio(
        self, 
        diagnosticos: List[Dict[str, Any]], 
        questionario_id: Any,
        tipo: str,
        org_id: Any = None,
        setor_id: Any = None,
        gerado_por: str = "system"
    ) -> Relatorio:
        
        if not diagnosticos:
            return Relatorio(
                idQuestionario=questionario_id,
                idOrganizacao=org_id,
                idSetor=setor_id,
                tipoRelatorio=tipo,
                geradoPor=gerado_por,
                metricas=RelatorioMetricas(mediaRiscoGlobal=0, indiceProtecao=0, totalRespondentes=0),
                dominios=[],
                recomendacoes=["Sem dados suficientes."]
            )

        total_respondentes = len(diagnosticos)
        agregacao_dimensoes: Dict[tuple, Dict[str, Any]] = {}

        for diag in diagnosticos:
            dimensoes = diag.get("dimensoes", [])
            for d in dimensoes:
                dominio = d.get("dominio", "Sem domínio")
                codigo = d.get("codigoDominio") or dominio
                dimensao = d.get("dimensao", "Sem dimensão")
                pontuacao = float(d.get("pontuacao", 0))
                classificacao = self._normalize_classificacao(d.get("classificacao"))
                sinal = d.get("sinal") or ("protecao" if copsoq_scoring_service.eh_dimensao_protecao(dimensao) else "risco")
                key = (codigo, dominio, dimensao, sinal)

                if key not in agregacao_dimensoes:
                    agregacao_dimensoes[key] = {
                        "medias": [],
                        "distribuicao": defaultdict(int),
                    }
                agregacao_dimensoes[key]["medias"].append(pontuacao)
                agregacao_dimensoes[key]["distribuicao"][classificacao] += 1

        dominios_map: Dict[tuple, List[RelatorioDimensao]] = {}
        for (codigo, dominio, dimensao, sinal), dados in agregacao_dimensoes.items():
            media = sum(dados["medias"]) / len(dados["medias"])
            classificacao_media = copsoq_scoring_service.classificar_tercil(media, dimensao)
            dim = RelatorioDimensao(
                dimensao=dimensao,
                media=round(media, 2),
                distribuicao={
                    ClassificacaoTercil.FAVORAVEL.value: int(dados["distribuicao"].get(ClassificacaoTercil.FAVORAVEL.value, 0)),
                    ClassificacaoTercil.INTERMEDIARIO.value: int(dados["distribuicao"].get(ClassificacaoTercil.INTERMEDIARIO.value, 0)),
                    ClassificacaoTercil.RISCO.value: int(dados["distribuicao"].get(ClassificacaoTercil.RISCO.value, 0)),
                },
                classificacao=classificacao_media,
                sinal=sinal,
            )
            dominios_map.setdefault((codigo, dominio), []).append(dim)

        dominios_result: List[RelatorioDominio] = []
        total_dim_risco = 0
        total_dim_classificadas = 0
        total_dim_protecao = 0
        total_dim_protecao_favoravel = 0

        for (codigo, nome), dimensoes in dominios_map.items():
            media_dominio = sum(d.media for d in dimensoes) / len(dimensoes)
            predominante = max(
                [ClassificacaoTercil.FAVORAVEL, ClassificacaoTercil.INTERMEDIARIO, ClassificacaoTercil.RISCO],
                key=lambda c: sum(1 for d in dimensoes if d.classificacao == c),
            )

            dominios_result.append(RelatorioDominio(
                codigo=codigo,
                nome=nome,
                dimensoes=dimensoes,
                media_dominio=round(media_dominio, 2),
                classificacao_predominante=predominante,
            ))

            for d in dimensoes:
                total_dim_classificadas += 1
                if d.classificacao == ClassificacaoTercil.RISCO:
                    total_dim_risco += 1
                if d.sinal == "protecao":
                    total_dim_protecao += 1
                    if d.classificacao == ClassificacaoTercil.FAVORAVEL:
                        total_dim_protecao_favoravel += 1

        risco_ratio = (total_dim_risco / total_dim_classificadas) if total_dim_classificadas else 0
        media_risco_global = round(risco_ratio * 4, 2)
        indice_protecao = round(
            (total_dim_protecao_favoravel / total_dim_protecao) * 100, 2
        ) if total_dim_protecao else 0.0

        return Relatorio(
            idQuestionario=questionario_id,
            idOrganizacao=org_id,
            idSetor=setor_id,
            tipoRelatorio=tipo,
            geradoPor=gerado_por,
            metricas=RelatorioMetricas(
                mediaRiscoGlobal=media_risco_global,
                indiceProtecao=indice_protecao,
                totalRespondentes=total_respondentes
            ),
            dominios=dominios_result,
            recomendacoes=self._gerar_recomendacoes(dominios_result)
        )
