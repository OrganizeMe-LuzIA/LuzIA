import { apiRequest } from "@/lib/api/client";

export const setoresApi = {
  create(
    payload: { idOrganizacao: string; nome: string; descricao?: string },
    token: string,
  ): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>("/setores/", {
      token,
      method: "POST",
      body: payload,
    });
  },

  update(
    setorId: string,
    payload: { idOrganizacao: string; nome: string; descricao?: string },
    token: string,
  ): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>(`/setores/${setorId}`, {
      token,
      method: "PUT",
      body: payload,
    });
  },

  remove(setorId: string, token: string): Promise<{ id: string; message: string }> {
    return apiRequest<{ id: string; message: string }>(`/setores/${setorId}`, {
      token,
      method: "DELETE",
    });
  },
};
