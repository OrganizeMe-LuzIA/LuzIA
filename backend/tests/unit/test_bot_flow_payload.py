from app.bot.flow import BotFlow


def test_extrair_valor_list_reply():
    flow = BotFlow()
    valor = flow._extrair_valor_botao({"listId": "2", "body": "Às vezes"})
    assert valor == 2


def test_extrair_valor_button_payload_invalido():
    flow = BotFlow()
    valor = flow._extrair_valor_botao({"buttonPayload": "abc"})
    assert valor is None
