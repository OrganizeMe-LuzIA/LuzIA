export type BadgeVariant =
  | "favoravel"
  | "intermediario"
  | "risco"
  | "alta"
  | "media"
  | "baixa"
  | "finalizado"
  | "em_andamento"
  | "nao_iniciado"
  | "ativo"
  | "inativo"
  | "default";

export type UserStatus = "finalizado" | "em andamento" | "não iniciado" | "em_andamento" | "nao_iniciado";

export interface ApiErrorPayload {
  detail?: string | Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface AuthToken {
  access_token: string;
  token_type: "bearer" | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AlertaDashboard {
  tipo: string;
  mensagem: string;
  severidade: "alta" | "media" | "baixa" | string;
  entidades_afetadas: string[];
}

export interface DashboardOverview {
  total_organizacoes: number;
  total_setores: number;
  total_usuarios: number;
  usuarios_ativos: number;
  questionarios_em_andamento: number;
  taxa_conclusao_geral: number;
  alertas: AlertaDashboard[];
  ultima_atualizacao: string;
}

export interface OrganizacaoDashboard {
  id: string;
  cnpj: string;
  nome: string;
  total_setores: number;
  total_usuarios: number;
  usuarios_ativos: number;
  questionarios_em_andamento: number;
  taxa_conclusao: number;
}

export interface SetorResumo {
  id: string;
  nome: string;
  total_usuarios: number;
  usuarios_ativos: number;
}

export interface QuestionarioResumo {
  id: string;
  nome: string;
  versao: string;
  codigo?: string | null;
  taxa_conclusao: number;
}

export interface OrganizacaoDetalhada {
  id: string;
  cnpj: string;
  nome: string;
  setores: SetorResumo[];
  usuarios_por_status: Record<string, number>;
  questionarios_status: QuestionarioResumo[];
}

export interface SetorDashboard {
  id: string;
  nome: string;
  organizacao_nome: string;
  total_usuarios: number;
  usuarios_ativos: number;
  taxa_resposta: number;
}

export interface UsuarioResumo {
  id: string;
  anon_id: string;
  status: UserStatus | string;
  respondido: boolean;
}

export interface OrganizacaoResumo {
  id: string;
  nome: string;
  cnpj: string;
}

export interface SetorDetalhado {
  id: string;
  nome: string;
  descricao?: string | null;
  organizacao: OrganizacaoResumo;
  usuarios: UsuarioResumo[];
  progresso_questionarios: Record<string, number>;
}

export interface UsuarioAtivo {
  id: string;
  telefone_mascarado: string;
  status: UserStatus | string;
  progresso_atual: number;
  questionario_em_andamento?: string | null;
  ultima_atividade: string;
  organizacao: string;
  setor?: string | null;
}

export interface ProgressoUsuario {
  id: string;
  questionario_nome: string;
  perguntas_respondidas: number;
  total_perguntas: number;
  percentual_conclusao: number;
  tempo_estimado_restante?: string | null;
  ultima_resposta?: string | null;
}

export interface QuestionarioStatus {
  id: string;
  nome: string;
  versao: string;
  codigo?: string | null;
  total_usuarios_atribuidos: number;
  total_respostas_completas: number;
  taxa_conclusao: number;
  tempo_medio_conclusao?: number | null;
}

export interface DimensaoCritica {
  dimensao: string;
  total_risco: number;
}

export interface QuestionarioMetricas {
  id: string;
  nome: string;
  distribuicao_classificacoes: Record<string, number>;
  dimensoes_criticas: DimensaoCritica[];
  organizacoes_participantes: string[];
  setores_participantes: string[];
}

export interface Organizacao {
  id: string;
  nome: string;
  cnpj: string;
  [key: string]: unknown;
}

export interface Questionario {
  id: string;
  nome: string;
  codigo?: string;
  versao?: string;
  totalPerguntas?: number;
  ativo?: boolean;
  [key: string]: unknown;
}

export interface Pergunta {
  id: string;
  idQuestionario: string;
  idPergunta: string;
  texto: string;
  dominio?: string;
  dimensao?: string;
  ordem?: number;
  [key: string]: unknown;
}

export interface RespostaItemPayload {
  idPergunta: string;
  valor?: number | number[];
  valorTexto?: string;
}

export interface RespostasPayload {
  anonId: string;
  idQuestionario: string;
  respostas: RespostaItemPayload[];
}

export interface SubmitRespostasResponse {
  message: string;
  task_id: string;
}

export interface Diagnostico {
  id: string;
  anonId: string;
  idQuestionario: string;
  resultadoGlobal: string;
  pontuacaoGlobal: number;
  dimensoes: Array<Record<string, unknown>>;
  dataAnalise: string;
}

export interface GerarRelatorioRequest {
  idQuestionario: string;
  idOrganizacao: string;
  idSetor?: string;
  anonId?: string;
  tipo: "organizacional" | "setorial" | "individual";
}

export interface GerarRelatorioResponse {
  id: string;
  message: string;
}

export type RelatorioExportFormat = "pdf" | "excel" | "csv";

export interface RelatorioMetricas {
  mediaRiscoGlobal: number;
  indiceProtecao: number;
  totalRespondentes: number;
}

export interface RelatorioDimensao {
  dimensao: string;
  media: number;
  distribuicao: Record<string, number>;
  classificacao: string;
  sinal: string;
}

export interface RelatorioDominio {
  codigo: string;
  nome: string;
  dimensoes: RelatorioDimensao[];
  media_dominio: number;
  classificacao_predominante: string;
}

export interface Relatorio {
  id: string;
  idQuestionario: string;
  idOrganizacao?: string;
  idSetor?: string;
  tipoRelatorio: string;
  geradoPor: string;
  dataGeracao: string;
  metricas: RelatorioMetricas;
  dominios: RelatorioDominio[];
  recomendacoes: string[];
  observacoes?: string;
}

export interface RelatorioResumo {
  id: string;
  idQuestionario?: string;
  idOrganizacao?: string;
  idSetor?: string;
  tipoRelatorio: string;
  geradoPor: string;
  dataGeracao: string;
  metricas: RelatorioMetricas;
  totalDominios: number;
  totalDimensoes: number;
}

export interface RelatorioExportResult {
  blob: Blob;
  filename: string;
}

export interface DashboardFilters {
  orgId: string;
  setorId: string;
  questionarioId: string;
  period: string;
}
