import { Diagnostico } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

export const diagnosticosApi = {
  getMe(token: string): Promise<Diagnostico[]> {
    return apiRequest<Diagnostico[]>("/diagnosticos/me", { token });
  },

  getById(diagnosticoId: string, token: string): Promise<Diagnostico> {
    return apiRequest<Diagnostico>(`/diagnosticos/${diagnosticoId}`, { token });
  },
};
