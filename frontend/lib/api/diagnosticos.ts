import { Diagnostico } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

const DIAGNOSTICOS_CACHE_TTL = {
  me: 20_000,
  byId: 30_000,
} as const;

export const diagnosticosApi = {
  getMe(token: string): Promise<Diagnostico[]> {
    return apiRequest<Diagnostico[]>("/diagnosticos/me", {
      token,
      cacheTtlMs: DIAGNOSTICOS_CACHE_TTL.me,
    });
  },

  getById(diagnosticoId: string, token: string): Promise<Diagnostico> {
    return apiRequest<Diagnostico>(`/diagnosticos/${diagnosticoId}`, {
      token,
      cacheTtlMs: DIAGNOSTICOS_CACHE_TTL.byId,
    });
  },
};
