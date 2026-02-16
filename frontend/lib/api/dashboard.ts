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

export const dashboardApi = {
  getOverview(token: string): Promise<DashboardOverview> {
    return apiRequest<DashboardOverview>("/dashboard/overview", { token });
  },

  listOrganizacoes(token: string): Promise<OrganizacaoDashboard[]> {
    return apiRequest<OrganizacaoDashboard[]>("/dashboard/organizacoes", { token });
  },

  getOrganizacaoDetalhada(orgId: string, token: string): Promise<OrganizacaoDetalhada> {
    return apiRequest<OrganizacaoDetalhada>(`/dashboard/organizacoes/${orgId}`, { token });
  },

  listSetores(token: string, orgId?: string): Promise<SetorDashboard[]> {
    return apiRequest<SetorDashboard[]>("/dashboard/setores", {
      token,
      query: { org_id: orgId || undefined },
    });
  },

  getSetorDetalhado(setorId: string, token: string): Promise<SetorDetalhado> {
    return apiRequest<SetorDetalhado>(`/dashboard/setores/${setorId}`, { token });
  },

  listUsuariosAtivos(
    token: string,
    params?: { orgId?: string; setorId?: string },
  ): Promise<UsuarioAtivo[]> {
    return apiRequest<UsuarioAtivo[]>("/dashboard/usuarios/ativos", {
      token,
      query: {
        org_id: params?.orgId || undefined,
        setor_id: params?.setorId || undefined,
      },
    });
  },

  getUsuarioProgresso(userId: string, token: string): Promise<ProgressoUsuario> {
    return apiRequest<ProgressoUsuario>(`/dashboard/usuarios/${userId}/progresso`, { token });
  },

  listQuestionariosStatus(token: string): Promise<QuestionarioStatus[]> {
    return apiRequest<QuestionarioStatus[]>("/dashboard/questionarios/status", { token });
  },

  getQuestionarioMetricas(questionarioId: string, token: string): Promise<QuestionarioMetricas> {
    return apiRequest<QuestionarioMetricas>(`/dashboard/questionarios/${questionarioId}/metricas`, { token });
  },
};
