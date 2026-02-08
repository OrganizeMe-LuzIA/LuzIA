import re
from pathlib import Path


SEED_FILE = Path(__file__).resolve().parents[2] / "mongo" / "seed_copsoq_curta_br.js"


def test_seed_curta_br_usa_versao_3():
    content = SEED_FILE.read_text(encoding="utf-8")
    assert 'versao: "3.0"' in content


def test_seed_curta_br_total_perguntas_bate_com_itens():
    content = SEED_FILE.read_text(encoding="utf-8")

    total_declared_match = re.search(r"totalPerguntas:\s*(\d+)", content)
    assert total_declared_match is not None
    total_declared = int(total_declared_match.group(1))

    total_ids = len(re.findall(r'idPergunta:\s*"', content))
    assert total_ids == total_declared


def test_seed_curta_br_validacao_usa_total_dinamico():
    content = SEED_FILE.read_text(encoding="utf-8")
    assert "const totalEsperado = perguntas.length;" in content


def test_seed_curta_br_contem_pergunta_texto_livre_final():
    content = SEED_FILE.read_text(encoding="utf-8")
    assert 'idPergunta: "OBS_TL_01"' in content
    assert 'tipoEscala: "texto_livre"' in content
