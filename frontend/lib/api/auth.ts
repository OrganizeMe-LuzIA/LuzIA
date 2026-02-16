import { AuthToken, LoginRequest } from "@/lib/types/api";
import { apiRequest } from "@/lib/api/client";

export const authApi = {
  login(payload: LoginRequest): Promise<AuthToken> {
    return apiRequest<AuthToken>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  registerCredentials(payload: {
    email: string;
    password: string;
    phone: string;
  }): Promise<{ message: string; email: string; saved: boolean }> {
    return apiRequest<{ message: string; email: string; saved: boolean }>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },
};
