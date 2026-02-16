import {
  DashboardOverview,
  OrganizacaoDashboard,
  OrganizacaoDetalhada,
  ProgressoUsuario,
  QuestionarioMetricas,
  QuestionarioStatus,
  SetorDashboard,
  SetorDetalhado,
  UsuarioAtivo,
} from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

interface DashboardRequestOptions {
  signal?: AbortSignal;
}

const DASHBOARD_CACHE_TTL = {
  overview: 10_000,
  organizacoesList: 60_000,
  organizacaoDetalhada: 30_000,
  setoresList: 45_000,
  setorDetalhado: 30_000,
  usuariosAtivos: 15_000,
  usuarioProgresso: 15_000,
  questionariosStatus: 60_000,
  questionarioMetricas: 20_000,
} as const;

export const dashboardApi = {
  getOverview(token: string, options: DashboardRequestOptions = {}): Promise<DashboardOverview> {
    return apiRequest<DashboardOverview>("/dashboard/overview", {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.overview,
      ...options,
    });
  },

  listOrganizacoes(token: string, options: DashboardRequestOptions = {}): Promise<OrganizacaoDashboard[]> {
    return apiRequest<OrganizacaoDashboard[]>("/dashboard/organizacoes", {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.organizacoesList,
      ...options,
    });
  },

  getOrganizacaoDetalhada(
    orgId: string,
    token: string,
    options: DashboardRequestOptions = {},
  ): Promise<OrganizacaoDetalhada> {
    return apiRequest<OrganizacaoDetalhada>(`/dashboard/organizacoes/${orgId}`, {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.organizacaoDetalhada,
      ...options,
    });
  },

  listSetores(token: string, orgId?: string, options: DashboardRequestOptions = {}): Promise<SetorDashboard[]> {
    return apiRequest<SetorDashboard[]>("/dashboard/setores", {
      token,
      query: { org_id: orgId || undefined },
      cacheTtlMs: DASHBOARD_CACHE_TTL.setoresList,
      ...options,
    });
  },

  getSetorDetalhado(
    setorId: string,
    token: string,
    options: DashboardRequestOptions = {},
  ): Promise<SetorDetalhado> {
    return apiRequest<SetorDetalhado>(`/dashboard/setores/${setorId}`, {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.setorDetalhado,
      ...options,
    });
  },

  listUsuariosAtivos(
    token: string,
    params?: { orgId?: string; setorId?: string },
    options: DashboardRequestOptions = {},
  ): Promise<UsuarioAtivo[]> {
    return apiRequest<UsuarioAtivo[]>("/dashboard/usuarios/ativos", {
      token,
      query: {
        org_id: params?.orgId || undefined,
        setor_id: params?.setorId || undefined,
      },
      cacheTtlMs: DASHBOARD_CACHE_TTL.usuariosAtivos,
      ...options,
    });
  },

  getUsuarioProgresso(
    userId: string,
    token: string,
    options: DashboardRequestOptions = {},
  ): Promise<ProgressoUsuario> {
    return apiRequest<ProgressoUsuario>(`/dashboard/usuarios/${userId}/progresso`, {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.usuarioProgresso,
      ...options,
    });
  },

  listQuestionariosStatus(token: string, options: DashboardRequestOptions = {}): Promise<QuestionarioStatus[]> {
    return apiRequest<QuestionarioStatus[]>("/dashboard/questionarios/status", {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.questionariosStatus,
      ...options,
    });
  },

  getQuestionarioMetricas(
    questionarioId: string,
    token: string,
    options: DashboardRequestOptions = {},
  ): Promise<QuestionarioMetricas> {
    return apiRequest<QuestionarioMetricas>(`/dashboard/questionarios/${questionarioId}/metricas`, {
      token,
      cacheTtlMs: DASHBOARD_CACHE_TTL.questionarioMetricas,
      ...options,
    });
  },
};
