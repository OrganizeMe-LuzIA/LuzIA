import {
  GerarRelatorioRequest,
  GerarRelatorioResponse,
  Relatorio,
  RelatorioExportFormat,
  RelatorioExportResult,
  RelatorioResumo,
} from "@/lib/types/api";
import { API_BASE_URL, apiRequest } from "@/lib/api/client";

const RELATORIOS_CACHE_TTL = {
  byId: 10_000,
  list: 15_000,
} as const;

function parseFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) {
    return null;
  }
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || null;
}

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

  list(
    token: string,
    filters: {
      questionarioId?: string;
      orgId?: string;
      setorId?: string;
      tipo?: "organizacional" | "setorial";
      limit?: number;
    } = {},
  ): Promise<RelatorioResumo[]> {
    return apiRequest<RelatorioResumo[]>("/relatorios", {
      token,
      query: {
        questionario_id: filters.questionarioId || undefined,
        org_id: filters.orgId || undefined,
        setor_id: filters.setorId || undefined,
        tipo: filters.tipo || undefined,
        limit: filters.limit ?? 20,
      },
      cacheTtlMs: RELATORIOS_CACHE_TTL.list,
    });
  },

  async exportById(
    relatorioId: string,
    format: RelatorioExportFormat,
    token: string,
  ): Promise<RelatorioExportResult> {
    const url = new URL(`${API_BASE_URL}/relatorios/${relatorioId}/export`);
    url.searchParams.set("format", format);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = (await response.json()) as { detail?: string };
        throw new Error(json.detail || `Erro ${response.status} ao exportar relatório.`);
      }
      const text = await response.text();
      throw new Error(text || `Erro ${response.status} ao exportar relatório.`);
    }

    const disposition = response.headers.get("content-disposition");
    const defaultExtension = format === "excel" ? "xlsx" : format;
    const filename = parseFilenameFromDisposition(disposition) || `relatorio_${relatorioId}.${defaultExtension}`;
    const blob = await response.blob();
    return { blob, filename };
  },
};
