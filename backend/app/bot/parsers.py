from typing import Union, List, Optional

def parse_answer(text: str, multipla: bool = False) -> Optional[Union[int, List[int]]]:
    """
    Se multipla=False: aceita só "3"
    Se multipla=True: aceita "3" ou "1,2,3,4,5" (vírgula/ espaço/ ; )
    Retorna None se inválido.
    """
    raw = (text or "").strip()
    if not raw:
        return None

    raw = raw.replace(";", ",")
    parts = [p.strip() for p in raw.replace(" ", ",").split(",") if p.strip()]

    # tenta converter p/ int
    try:
        nums = [int(p) for p in parts]
    except ValueError:
        return None

    # valida range 1..5
    if any(n < 1 or n > 5 for n in nums):
        return None

    # se não é multipla, só pode 1 número
    if not multipla:
        return nums[0] if len(nums) == 1 else None

    # multipla=True: remove duplicados mantendo ordem
    unique = []
    for n in nums:
        if n not in unique:
            unique.append(n)

    return unique if len(unique) > 1 else unique[0]
