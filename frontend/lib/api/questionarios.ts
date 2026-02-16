import { Pergunta, Questionario } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

export const questionariosApi = {
  list(token: string): Promise<Questionario[]> {
    return apiRequest<Questionario[]>("/questionarios", { token });
  },

  getById(questionarioId: string, token: string): Promise<Questionario> {
    return apiRequest<Questionario>(`/questionarios/${questionarioId}`, { token });
  },

  listPerguntas(questionarioId: string, token: string): Promise<Pergunta[]> {
    return apiRequest<Pergunta[]>(`/questionarios/${questionarioId}/perguntas`, { token });
  },
};
