import re


def _only_digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def validar_cnpj(cnpj: str) -> bool:
    """
    Valida CNPJ com cálculo dos dígitos verificadores.
    """
    digits = _only_digits(cnpj)
    if len(digits) != 14:
        return False
    if digits == digits[0] * 14:
        return False

    def _calc_digit(base: str, weights: list[int]) -> str:
        total = sum(int(d) * w for d, w in zip(base, weights))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    d1 = _calc_digit(digits[:12], w1)
    d2 = _calc_digit(digits[:12] + d1, w2)

    return digits[-2:] == d1 + d2


def validar_telefone_br(telefone: str) -> bool:
    """
    Aceita formato E.164 (+5511999999999) ou número BR com/sem máscara.
    """
    if not telefone:
        return False
    if re.fullmatch(r"^\+\d{10,15}$", telefone):
        return True

    digits = _only_digits(telefone)
    if len(digits) == 13 and digits.startswith("55"):
        return True
    if len(digits) in (10, 11):
        return True
    return False


def validar_email(email: str) -> bool:
    """
    Validação pragmática de e-mail.
    """
    if not email:
        return False
    pattern = r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$"
    return re.fullmatch(pattern, email) is not None
