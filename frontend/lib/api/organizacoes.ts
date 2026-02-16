import { Organizacao } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

const ORGANIZACOES_CACHE_TTL = {
  list: 60_000,
  byId: 30_000,
} as const;

export const organizacoesApi = {
  list(token: string, limit = 100): Promise<Organizacao[]> {
    return apiRequest<Organizacao[]>("/organizacoes", {
      token,
      query: { limit },
      cacheTtlMs: ORGANIZACOES_CACHE_TTL.list,
    });
  },

  getById(orgId: string, token: string): Promise<Organizacao> {
    return apiRequest<Organizacao>(`/organizacoes/${orgId}`, {
      token,
      cacheTtlMs: ORGANIZACOES_CACHE_TTL.byId,
    });
  },

  create(payload: { nome: string; cnpj: string; codigo?: string }, token: string): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>("/organizacoes/", {
      token,
      method: "POST",
      body: payload,
    });
  },

  update(
    orgId: string,
    payload: { nome: string; cnpj: string; codigo?: string },
    token: string,
  ): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>(`/organizacoes/${orgId}`, {
      token,
      method: "PUT",
      body: payload,
    });
  },

  remove(orgId: string, token: string): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>(`/organizacoes/${orgId}`, {
      token,
      method: "DELETE",
    });
  },
};
