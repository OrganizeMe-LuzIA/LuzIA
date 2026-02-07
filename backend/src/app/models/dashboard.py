from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class SetorResumo(BaseModel):
    id: str
    nome: str
    total_usuarios: int
    usuarios_ativos: int


class QuestionarioResumo(BaseModel):
    id: str
    nome: str
    versao: str
    codigo: Optional[str] = None
    taxa_conclusao: float


class OrganizacaoResumo(BaseModel):
    id: str
    nome: str
    cnpj: str


class UsuarioResumo(BaseModel):
    id: str
    anon_id: str
    status: str
    respondido: bool


class DimensaoCritica(BaseModel):
    dimensao: str
    total_risco: int


class AlertaDashboard(BaseModel):
    tipo: str
    mensagem: str
    severidade: str
    entidades_afetadas: List[str]


class OrganizacaoDashboard(BaseModel):
    id: str
    cnpj: str
    nome: str
    total_setores: int
    total_usuarios: int
    usuarios_ativos: int
    questionarios_em_andamento: int
    taxa_conclusao: float


class OrganizacaoDetalhada(BaseModel):
    id: str
    cnpj: str
    nome: str
    setores: List[SetorResumo]
    usuarios_por_status: Dict[str, int]
    questionarios_status: List[QuestionarioResumo]


class SetorDashboard(BaseModel):
    id: str
    nome: str
    organizacao_nome: str
    total_usuarios: int
    usuarios_ativos: int
    taxa_resposta: float


class SetorDetalhado(BaseModel):
    id: str
    nome: str
    descricao: Optional[str] = None
    organizacao: OrganizacaoResumo
    usuarios: List[UsuarioResumo]
    progresso_questionarios: Dict[str, float]


class UsuarioAtivo(BaseModel):
    id: str
    telefone_mascarado: str
    status: str
    progresso_atual: float
    questionario_em_andamento: Optional[str]
    ultima_atividade: datetime
    organizacao: str
    setor: Optional[str]


class ProgressoUsuario(BaseModel):
    id: str
    questionario_nome: str
    perguntas_respondidas: int
    total_perguntas: int
    percentual_conclusao: float
    tempo_estimado_restante: Optional[str]
    ultima_resposta: Optional[datetime]


class QuestionarioStatus(BaseModel):
    id: str
    nome: str
    versao: str
    codigo: Optional[str] = None
    total_usuarios_atribuidos: int
    total_respostas_completas: int
    taxa_conclusao: float
    tempo_medio_conclusao: Optional[int]


class QuestionarioMetricas(BaseModel):
    id: str
    nome: str
    distribuicao_classificacoes: Dict[str, int]
    dimensoes_criticas: List[DimensaoCritica]
    organizacoes_participantes: List[str]
    setores_participantes: List[str]


class DashboardOverview(BaseModel):
    total_organizacoes: int
    total_setores: int
    total_usuarios: int
    usuarios_ativos: int
    questionarios_em_andamento: int
    taxa_conclusao_geral: float
    alertas: List[AlertaDashboard]
    ultima_atualizacao: datetime

