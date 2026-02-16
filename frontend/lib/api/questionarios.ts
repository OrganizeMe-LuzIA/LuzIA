import { Pergunta, Questionario } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

const QUESTIONARIOS_CACHE_TTL = {
  list: 60_000,
  byId: 30_000,
  perguntas: 60_000,
} as const;

export const questionariosApi = {
  list(token: string): Promise<Questionario[]> {
    return apiRequest<Questionario[]>("/questionarios", {
      token,
      cacheTtlMs: QUESTIONARIOS_CACHE_TTL.list,
    });
  },

  getById(questionarioId: string, token: string): Promise<Questionario> {
    return apiRequest<Questionario>(`/questionarios/${questionarioId}`, {
      token,
      cacheTtlMs: QUESTIONARIOS_CACHE_TTL.byId,
    });
  },

  listPerguntas(questionarioId: string, token: string): Promise<Pergunta[]> {
    return apiRequest<Pergunta[]>(`/questionarios/${questionarioId}/perguntas`, {
      token,
      cacheTtlMs: QUESTIONARIOS_CACHE_TTL.perguntas,
    });
  },
};
