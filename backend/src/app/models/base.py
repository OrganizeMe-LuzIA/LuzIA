from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from enum import Enum
import re
from app.services.copsoq_scoring_service import ClassificacaoTercil
from app.core.validators import validar_cnpj

# ==============================================================================
# Enums
# ==============================================================================

class StatusEnum(str, Enum):
    FINALIZADO = "finalizado"
    EM_ANDAMENTO = "em andamento"
    NAO_INICIADO = "não iniciado"


VALID_USER_STATUSES = {status.value for status in StatusEnum}

_USER_STATUS_ALIASES: Dict[str, str] = {
    "finalizado": StatusEnum.FINALIZADO.value,
    "em_andamento": StatusEnum.EM_ANDAMENTO.value,
    "em andamento": StatusEnum.EM_ANDAMENTO.value,
    "nao_iniciado": StatusEnum.NAO_INICIADO.value,
    "nao iniciado": StatusEnum.NAO_INICIADO.value,
    "não iniciado": StatusEnum.NAO_INICIADO.value,
}

_USER_STATUS_EQUIVALENTS: Dict[str, List[str]] = {
    StatusEnum.FINALIZADO.value: [StatusEnum.FINALIZADO.value],
    StatusEnum.EM_ANDAMENTO.value: [StatusEnum.EM_ANDAMENTO.value, "em_andamento"],
    StatusEnum.NAO_INICIADO.value: [StatusEnum.NAO_INICIADO.value, "nao_iniciado"],
}


def normalize_user_status(status: Optional[Union[str, StatusEnum]]) -> str:
    if isinstance(status, StatusEnum):
        return status.value

    raw = str(status or "").strip().lower()
    if not raw:
        return StatusEnum.NAO_INICIADO.value
    return _USER_STATUS_ALIASES.get(raw, raw)


def user_status_values(status: Union[str, StatusEnum]) -> List[str]:
    canonical = normalize_user_status(status)
    return _USER_STATUS_EQUIVALENTS.get(canonical, [canonical])


def is_active_user_status(status: Optional[Union[str, StatusEnum]]) -> bool:
    return normalize_user_status(status) in {
        StatusEnum.EM_ANDAMENTO.value,
        StatusEnum.FINALIZADO.value,
    }


def is_in_progress_user_status(status: Optional[Union[str, StatusEnum]]) -> bool:
    return normalize_user_status(status) == StatusEnum.EM_ANDAMENTO.value

# ==============================================================================
# COPSOQ II - Modelos Auxiliares
# ==============================================================================

class Dominio(BaseModel):
    """Domínio de um questionário COPSOQ II (ex: Exigências Laborais, Saúde e Bem-Estar)"""
    codigo: str
    nome: str
    ordem: int
    descricao: Optional[str] = None

class OpcaoResposta(BaseModel):
    """Opção de resposta para uma pergunta (ex: {valor: 4, texto: 'Sempre'})"""
    valor: int
    texto: str

class SubPergunta(BaseModel):
    """Sub-pergunta condicional (usada em Comportamentos Ofensivos)"""
    condicao: str  # ex: "valor > 0"
    texto: str
    tipoResposta: str  # ex: "multipla_escolha"
    opcoes: List[str]

# ==============================================================================
# Modelos Base
# ==============================================================================

class UserState(BaseModel):
    """Estado do usuário durante o fluxo do chatbot"""
    idQuestionario: Optional[str] = None
    indicePergunta: int = 0
    statusChat: str = "INATIVO"  # INATIVO, EM_CURSO, FINALIZADO
    dataInicio: Optional[datetime] = None

class Organizacao(BaseModel):
    cnpj: str
    nome: str
    codigo: Optional[str] = None

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj(cls, value: str) -> str:
        cnpj_clean = re.sub(r"\D", "", value or "")
        if not validar_cnpj(cnpj_clean):
            raise ValueError("CNPJ inválido")
        return cnpj_clean

class Setor(BaseModel):
    idOrganizacao: Any  # MongoDB ObjectId
    nome: str
    descricao: Optional[str] = None

class Usuario(BaseModel):
    telefone: str
    email: Optional[str] = None
    password_hash: Optional[str] = None
    idOrganizacao: Any  # MongoDB ObjectId
    idSetor: Optional[Any] = None
    numeroUnidade: Optional[str] = None
    status: StatusEnum = StatusEnum.NAO_INICIADO
    respondido: bool = False
    anonId: str
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("telefone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not re.fullmatch(r"^\+\d{10,15}$", value or ""):
            raise ValueError("Telefone deve estar no formato E.164")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().lower()
        if not re.fullmatch(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", normalized):
            raise ValueError("Email inválido")
        return normalized

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, value: Optional[Union[str, StatusEnum]]) -> str:
        return normalize_user_status(value)

    model_config = ConfigDict(arbitrary_types_allowed=True, use_enum_values=True)

# ==============================================================================
# COPSOQ II - Questionário e Perguntas
# ==============================================================================

class Pergunta(BaseModel):
    """
    Pergunta do questionário COPSOQ II.
    
    Campos novos para COPSOQ II:
    - codigoDominio: código do domínio (EL, OTC, RSL, etc.)
    - tipoEscala: tipo de escala (frequencia, intensidade, etc.)
    - ordem: ordem de apresentação
    - opcoesResposta: lista de opções de resposta
    - subPergunta: pergunta condicional (Comportamentos Ofensivos)
    """
    idQuestionario: Any
    codigoDominio: Optional[str] = None  # NOVO: código do domínio (EL, OTC, etc.)
    dominio: str
    dimensao: str
    idPergunta: str
    texto: str
    tipoEscala: str = "frequencia"  # RENOMEADO de 'tipo' - frequencia, intensidade, etc.
    sinal: str = "risco"  # risco ou protecao
    itemInvertido: bool = False
    ordem: Optional[int] = None  # NOVO: ordem de apresentação
    opcoesResposta: Optional[List[OpcaoResposta]] = None  # NOVO: opções de resposta
    subPergunta: Optional[SubPergunta] = None  # NOVO: pergunta condicional
    ativo: bool = True
    
    # Campos legados para compatibilidade
    tipo: Optional[str] = None  # DEPRECATED: use tipoEscala
    escala: Optional[int] = 5  # DEPRECATED: use opcoesResposta

class Questionario(BaseModel):
    """
    Questionário COPSOQ II.
    
    Suporta duas versões:
    - COPSOQ_CURTA_BR: Versão curta brasileira
    - COPSOQ_MEDIA_PT: Versão média portuguesa (76 perguntas)
    """
    nome: str
    codigo: Optional[str] = None  # NOVO: COPSOQ_CURTA_BR ou COPSOQ_MEDIA_PT
    versao: str
    tipo: str = "psicossocial"  # NOVO: tipo do questionário
    idioma: str = "pt-BR"  # NOVO: pt-BR ou pt-PT
    descricao: str
    dominios: Union[List[str], List[Dominio]]  # Aceita formato antigo ou novo
    escalasPossiveis: Optional[List[str]] = None  # NOVO: escalas disponíveis
    escala: Optional[str] = None  # DEPRECATED: use escalasPossiveis
    totalPerguntas: int
    ativo: bool = True

class RespostaItem(BaseModel):
    valor: Optional[Union[int, List[int]]] = Field(default=None)
    valorTexto: Optional[str] = Field(default=None, min_length=1, max_length=1000)
    idPergunta: str

    @model_validator(mode="after")
    def validate_resposta(self):
        if self.valor is None and not self.valorTexto:
            raise ValueError("Informe 'valor' ou 'valorTexto'.")

        if isinstance(self.valor, int):
            if self.valor < 0 or self.valor > 5:
                raise ValueError("'valor' deve estar entre 0 e 5.")
        elif isinstance(self.valor, list):
            if not self.valor:
                raise ValueError("'valor' não pode ser lista vazia.")
            if any((not isinstance(v, int) or v < 0 or v > 5) for v in self.valor):
                raise ValueError("Todos os itens de 'valor' devem ser inteiros entre 0 e 5.")

        return self

class Respostas(BaseModel):
    anonId: str
    idQuestionario: Any
    data: datetime = Field(default_factory=datetime.utcnow)
    respostas: List[RespostaItem]

class DiagnosticoDimensao(BaseModel):
    dominio: str
    codigoDominio: Optional[str] = None
    dimensao: str
    pontuacao: float
    classificacao: ClassificacaoTercil
    sinal: str = "risco"
    total_itens: int = 0
    itens_respondidos: int = 0
    itens: Optional[List[Dict[str, Any]]] = None

class Diagnostico(BaseModel):
    anonId: str
    idQuestionario: Any
    resultadoGlobal: str
    pontuacaoGlobal: float
    dimensoes: List[DiagnosticoDimensao]
    dataAnalise: datetime = Field(default_factory=datetime.utcnow)

class RelatorioMetricas(BaseModel):
    mediaRiscoGlobal: float
    indiceProtecao: float
    totalRespondentes: int

class RelatorioDimensao(BaseModel):
    dimensao: str
    media: float
    distribuicao: Dict[str, int] = Field(default_factory=dict)
    classificacao: ClassificacaoTercil
    sinal: str

class RelatorioDominio(BaseModel):
    codigo: str
    nome: str
    dimensoes: List[RelatorioDimensao]
    media_dominio: float
    classificacao_predominante: ClassificacaoTercil

class Relatorio(BaseModel):
    idQuestionario: Any
    idOrganizacao: Optional[Any] = None
    idSetor: Optional[Any] = None
    tipoRelatorio: str # organizacional, setorial, individual
    geradoPor: str
    dataGeracao: datetime = Field(default_factory=datetime.utcnow)
    metricas: RelatorioMetricas
    dominios: List[RelatorioDominio]
    recomendacoes: List[str] = Field(default_factory=list)
    observacoes: Optional[str] = None
