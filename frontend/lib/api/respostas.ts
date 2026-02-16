import { RespostasPayload, SubmitRespostasResponse } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

export const respostasApi = {
  submit(payload: RespostasPayload, token: string): Promise<SubmitRespostasResponse> {
    return apiRequest<SubmitRespostasResponse>("/respostas", {
      token,
      method: "POST",
      body: payload,
    });
  },
};
