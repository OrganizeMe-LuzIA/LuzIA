import pytest
from pydantic import ValidationError

from app.models.base import RespostaItem


def test_resposta_item_aceita_valor_texto_sem_valor_numerico():
    item = RespostaItem(idPergunta="OBS_TL_01", valorTexto="Relato livre de condições de trabalho.")
    assert item.valor is None
    assert item.valorTexto is not None


def test_resposta_item_exige_valor_ou_valor_texto():
    with pytest.raises(ValidationError):
        RespostaItem(idPergunta="OBS_TL_01")
