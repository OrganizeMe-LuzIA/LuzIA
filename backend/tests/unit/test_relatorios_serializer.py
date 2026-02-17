from datetime import UTC, datetime

from bson import ObjectId

from app.api.v1.relatorios import _serialize_relatorio


def test_serialize_relatorio_handles_object_id_fields() -> None:
    questionario_id = ObjectId()
    organizacao_id = ObjectId()
    setor_id = ObjectId()
    relatorio_id = ObjectId()

    doc = {
        "_id": relatorio_id,
        "idQuestionario": questionario_id,
        "idOrganizacao": organizacao_id,
        "idSetor": setor_id,
        "tipoRelatorio": "setorial",
        "geradoPor": "seed-demo-relatorios-v1",
        "dataGeracao": datetime.now(UTC),
        "metricas": {"mediaRiscoGlobal": 2.1, "indiceProtecao": 0.58, "totalRespondentes": 8},
        "dominios": [{"nome": "Exigências Laborais", "dimensoes": [{"dimensao": "Carga"}]}],
        "recomendacoes": ["Priorizar plano de ação"],
        "observacoes": "Relatório de teste",
    }

    payload = _serialize_relatorio(doc, include_full_payload=True)

    assert payload["id"] == str(relatorio_id)
    assert payload["idQuestionario"] == str(questionario_id)
    assert payload["idOrganizacao"] == str(organizacao_id)
    assert payload["idSetor"] == str(setor_id)
    assert payload["totalDominios"] == 1
    assert payload["totalDimensoes"] == 1
