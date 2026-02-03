from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from enum import Enum

# ==============================================================================
# Enums
# ==============================================================================

class StatusEnum(str, Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    AGUARDANDO_CONFIRMACAO = "aguardando_confirmacao"

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

class Setor(BaseModel):
    idOrganizacao: Any  # MongoDB ObjectId
    nome: str
    descricao: Optional[str] = None

class Usuario(BaseModel):
    telefone: str
    idOrganizacao: Any  # MongoDB ObjectId
    idSetor: Optional[Any] = None
    status: StatusEnum = StatusEnum.AGUARDANDO_CONFIRMACAO
    respondido: bool = False
    anonId: str
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
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
    - COPSOQ_CURTA_BR: Versão curta brasileira (40 itens)
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
    valor: int = Field(ge=0, le=4)
    idPergunta: str

class Respostas(BaseModel):
    anonId: str
    idQuestionario: Any
    data: datetime = Field(default_factory=datetime.utcnow)
    respostas: List[RespostaItem]

class DiagnosticoDimensao(BaseModel):
    dominio: str
    dimensao: str
    pontuacao: float
    classificacao: str
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

class Relatorio(BaseModel):
    idQuestionario: Any
    idOrganizacao: Optional[Any] = None
    idSetor: Optional[Any] = None
    tipoRelatorio: str # organizacional, setorial, individual
    geradoPor: str
    dataGeracao: datetime = Field(default_factory=datetime.utcnow)
    metricas: RelatorioMetricas
    dominios: List[Dict[str, Any]]
    recomendacoes: List[str] = Field(default_factory=list)
    observacoes: Optional[str] = None
