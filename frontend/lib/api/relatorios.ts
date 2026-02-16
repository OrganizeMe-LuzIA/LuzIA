import { GerarRelatorioRequest, GerarRelatorioResponse, Relatorio } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

const RELATORIOS_CACHE_TTL = {
  byId: 10_000,
} as const;

export const relatoriosApi = {
  gerar(payload: GerarRelatorioRequest, token: string): Promise<GerarRelatorioResponse> {
    return apiRequest<GerarRelatorioResponse>("/relatorios/gerar", {
      token,
      method: "POST",
      body: payload,
    });
  },

  gerarAsync(
    payload: GerarRelatorioRequest,
    token: string,
  ): Promise<{ task_id: string; status: string; message: string }> {
    return apiRequest<{ task_id: string; status: string; message: string }>("/relatorios/gerar-async", {
      token,
      method: "POST",
      body: payload,
    });
  },

  getById(relatorioId: string, token: string): Promise<Relatorio> {
    return apiRequest<Relatorio>(`/relatorios/${relatorioId}`, {
      token,
      cacheTtlMs: RELATORIOS_CACHE_TTL.byId,
    });
  },
};
