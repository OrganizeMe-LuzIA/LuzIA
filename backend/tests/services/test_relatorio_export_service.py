import pytest

from app.services.relatorio_export_service import RelatorioExportService


def _sample_relatorio():
    return {
        "id": "507f1f77bcf86cd799439011",
        "tipoRelatorio": "organizacional",
        "geradoPor": "test",
        "dataGeracao": "2026-02-17T12:00:00Z",
        "metricas": {
            "mediaRiscoGlobal": 2.45,
            "indiceProtecao": 58.2,
            "totalRespondentes": 12,
        },
        "dominios": [
            {
                "codigo": "EL",
                "nome": "Exigências Laborais",
                "dimensoes": [
                    {
                        "dimensao": "Exigências quantitativas",
                        "media": 3.62,
                        "classificacao": "risco",
                        "sinal": "risco",
                        "distribuicao": {"favoravel": 2, "intermediario": 4, "risco": 6},
                    }
                ],
            }
        ],
        "recomendacoes": ["Revisar carga de trabalho por equipe."],
    }


def test_export_csv_content():
    service = RelatorioExportService()
    exported = service.export(_sample_relatorio(), "csv")
    assert exported["media_type"].startswith("text/csv")
    content = exported["payload"].decode("utf-8-sig")
    assert "Exigências quantitativas" in content
    assert "Média de Risco Global" in content


def test_export_excel_content():
    pytest.importorskip("openpyxl")
    service = RelatorioExportService()
    exported = service.export(_sample_relatorio(), "excel")
    assert exported["filename"].endswith(".xlsx")
    assert exported["media_type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(exported["payload"]) > 1000


def test_export_pdf_content():
    pytest.importorskip("fpdf")
    service = RelatorioExportService()
    exported = service.export(_sample_relatorio(), "pdf")
    assert exported["filename"].endswith(".pdf")
    assert exported["media_type"] == "application/pdf"
    assert exported["payload"].startswith(b"%PDF")
