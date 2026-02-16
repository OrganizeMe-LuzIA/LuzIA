import { Organizacao } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

export const organizacoesApi = {
  list(token: string, limit = 100): Promise<Organizacao[]> {
    return apiRequest<Organizacao[]>("/organizacoes", {
      token,
      query: { limit },
    });
  },

  getById(orgId: string, token: string): Promise<Organizacao> {
    return apiRequest<Organizacao>(`/organizacoes/${orgId}`, { token });
  },

  create(payload: { nome: string; cnpj: string; codigo?: string }, token: string): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>("/organizacoes", {
      token,
      method: "POST",
      body: payload,
    });
  },
};
