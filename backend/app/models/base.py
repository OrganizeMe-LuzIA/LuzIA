from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from bson import ObjectId

class UserState(BaseModel):
    # Field to manage bot flow, will be stored inside 'metadata' or 'state'
    # Since DB has additionalProperties: false, we'll store this in 'metadata'
    idQuestionario: Optional[str] = None
    indicePergunta: int = 0
    statusChat: str = "INATIVO" # INATIVO, EM_CURSO, FINALIZADO
    dataInicio: Optional[datetime] = None

class Usuario(BaseModel):
    telefone: str
    idOrganizacao: Any # MongoDB ObjectId
    idSetor: Optional[Any] = None
    status: str = "aguardando_confirmacao" # Matches enum in DB
    respondido: bool = False
    anonId: str
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

class Pergunta(BaseModel):
    idQuestionario: Any
    dominio: str
    dimensao: str
    idPergunta: str
    texto: str
    tipo: str = "escala_likert" # Matches enum in DB
    sinal: str = "risco" # Matches enum in DB
    itemInvertido: bool = False
    escala: int = 5 # Matches DB (number of options)
    ativo: bool = True

class Questionario(BaseModel):
    nome: str
    versao: str
    descricao: str
    dominios: List[str]
    escala: str
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
