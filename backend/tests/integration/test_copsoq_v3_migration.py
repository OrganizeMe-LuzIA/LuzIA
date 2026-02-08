from pathlib import Path


MIGRATION_FILE = Path(__file__).resolve().parents[2] / "mongo" / "migration_copsoq_v2_to_v3.js"


def test_script_migracao_copsoq_v3_existe():
    assert MIGRATION_FILE.exists()


def test_script_migracao_copsoq_v3_tem_backup_e_update():
    content = MIGRATION_FILE.read_text(encoding="utf-8")

    assert 'const CODIGO_QUESTIONARIO = "COPSOQ_CURTA_BR";' in content
    assert 'const VERSAO_ORIGEM = "2.0";' in content
    assert 'const VERSAO_DESTINO = "3.0";' in content
    assert "db.backup_copsoq_v2_to_v3.insertOne" in content
    assert "db.questionarios.updateOne" in content
    assert "historicoVersoes" in content


def test_script_migracao_copsoq_v3_preserva_rastreabilidade():
    content = MIGRATION_FILE.read_text(encoding="utf-8")

    assert "db.respostas.updateMany" in content
    assert "db.diagnosticos.updateMany" in content
    assert "db.relatorios.updateMany" in content
    assert "questionarioVersao" in content


def test_script_migracao_copsoq_v3_inclui_pergunta_texto_livre():
    content = MIGRATION_FILE.read_text(encoding="utf-8")

    assert 'idPergunta: "OBS_TL_01"' in content
    assert 'tipoEscala: "texto_livre"' in content
    assert '"Observações finais"' in content
