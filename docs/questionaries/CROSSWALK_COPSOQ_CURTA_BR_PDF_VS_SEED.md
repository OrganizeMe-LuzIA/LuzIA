# Crosswalk COPSOQ Curta BR: PDF vs Seed

- Seed: `backend/mongo/seed_copsoq_curta_br.js`
- Fonte PDF extraída: `docs/1 Questionário COPSOQ II BR.txt`
- Total no seed: **41**
- Total perguntas fechadas detectadas no PDF extraído: **40**
- Bloco final de texto livre detectado: **sim**
- Itens idênticos (normalizado): **37**
- Itens divergentes: **4**
- Itens ausentes no PDF extraído: **0**

## Diferenças detectadas

- `5B)` / `OTC_PD_01B`
  - Seed: "Seu trabalho exige que você tome iniciativas?"
  - PDF: "O seu trabalho exig e que você tome iniciativas?"
- `6A)` / `OTC_ST_01A`
  - Seed: "Seu trabalho é significativo?"
  - PDF: "O seu trabalho é significativo?"
- `6B)` / `OTC_ST_01B`
  - Seed: "Você sente que o trabalho que faz é importante?"
  - PDF: "Você sente que o trabalho que você faz é importante?"
- `23)` / `CO_BU_01`
  - Seed: "Você foi exposto a "bullying" no seu local de trabalho nos últimos 12 meses?"
  - PDF: "Você foi exposto a ͞ďƵůůǇŝŶŐ͟ no seu local de trabalho nos últimos 12 meses?"

## Tabela resumida

| Ordem | ID Seed | Rótulo PDF | Status |
|---|---|---|---|
| 1 | `EL_EQ_01A` | `1A)` | OK |
| 2 | `EL_EQ_01B` | `1B)` | OK |
| 3 | `EL_RT_01A` | `2A)` | OK |
| 4 | `EL_RT_01B` | `2B)` | OK |
| 5 | `EL_EE_01A` | `3A)` | OK |
| 6 | `EL_EE_01B` | `3B)` | OK |
| 7 | `OTC_IT_01A` | `4A)` | OK |
| 8 | `OTC_IT_01B` | `4B)` | OK |
| 9 | `OTC_PD_01A` | `5A)` | OK |
| 10 | `OTC_PD_01B` | `5B)` | DIVERGENTE |
| 11 | `OTC_ST_01A` | `6A)` | DIVERGENTE |
| 12 | `OTC_ST_01B` | `6B)` | DIVERGENTE |
| 13 | `OTC_CLT_01A` | `7A)` | OK |
| 14 | `OTC_CLT_01B` | `7B)` | OK |
| 15 | `RSL_PR_01A` | `8A)` | OK |
| 16 | `RSL_PR_01B` | `8B)` | OK |
| 17 | `RSL_RE_01A` | `9A)` | OK |
| 18 | `RSL_RE_01B` | `9B)` | OK |
| 19 | `RSL_TP_01A` | `10A)` | OK |
| 20 | `RSL_TP_01B` | `10B)` | OK |
| 21 | `RSL_QL_01A` | `11A)` | OK |
| 22 | `RSL_QL_01B` | `11B)` | OK |
| 23 | `RSL_ASS_01A` | `12A)` | OK |
| 24 | `RSL_ASS_01B` | `12B)` | OK |
| 25 | `ITI_ST_01` | `13)` | OK |
| 26 | `ITI_CTF_01A` | `14A)` | OK |
| 27 | `ITI_CTF_01B` | `14B)` | OK |
| 28 | `VLT_CV_01A` | `15A)` | OK |
| 29 | `VLT_CV_01B` | `15B)` | OK |
| 30 | `VLT_JR_01A` | `16A)` | OK |
| 31 | `VLT_JR_01B` | `16B)` | OK |
| 32 | `SBE_SG_01` | `17)` | OK |
| 33 | `SBE_BO_01A` | `18A)` | OK |
| 34 | `SBE_BO_01B` | `18B)` | OK |
| 35 | `SBE_ST_01A` | `19A)` | OK |
| 36 | `SBE_ST_01B` | `19B)` | OK |
| 37 | `CO_ASI_01` | `20)` | OK |
| 38 | `CO_AV_01` | `21)` | OK |
| 39 | `CO_VF_01` | `22)` | OK |
| 40 | `CO_BU_01` | `23)` | DIVERGENTE |
| 41 | `OBS_TL_01` | `OBS` | OK |
