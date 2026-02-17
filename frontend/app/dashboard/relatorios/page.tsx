"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, BarChart3, Clock4, FileSpreadsheet, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExportButton } from "@/components/ui/ExportButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, relatoriosApi } from "@/lib/api";
import {
  GerarRelatorioRequest,
  QuestionarioMetricas,
  Relatorio,
  RelatorioExportFormat,
  RelatorioResumo,
  SetorDashboard,
} from "@/lib/types/api";
import { clamp, formatDateTime, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";
import { usePollingRefetch } from "@/lib/utils/usePollingRefetch";

interface ReportFormState {
  idQuestionario: string;
  idOrganizacao: string;
  idSetor: string;
  tipo: "organizacional" | "setorial";
}

const RadarScoreChart = dynamic(
  () => import("@/components/charts/RadarScoreChart").then((module) => module.RadarScoreChart),
  {
    ssr: false,
    loading: () => <div className="h-[340px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

const VerticalStackedDistributionChart = dynamic(
  () =>
    import("@/components/charts/VerticalStackedDistributionChart").then(
      (module) => module.VerticalStackedDistributionChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-[340px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function getHeatColor(value: number): string {
  if (value >= 70) {
    return "#ef4444";
  }
  if (value >= 50) {
    return "#f59e0b";
  }
  return "#10b981";
}

function isSupportedExportFormat(format: string): format is RelatorioExportFormat {
  return format === "pdf" || format === "excel" || format === "csv";
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatTipoRelatorio(tipo: string): string {
  return tipo === "setorial" ? "Setorial" : "Organizacional";
}

export default function RelatoriosPage() {
  const { token } = useAuth();

  const [form, setForm] = useState<ReportFormState>({
    idQuestionario: "",
    idOrganizacao: "",
    idSetor: "",
    tipo: "organizacional",
  });

  const [setores, setSetores] = useState<SetorDashboard[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAsyncSubmit, setLoadingAsyncSubmit] = useState(false);
  const [loadingExport, setLoadingExport] = useState<RelatorioExportFormat | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [relatorioId, setRelatorioId] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  const [metricasQuestionario, setMetricasQuestionario] = useState<QuestionarioMetricas | null>(null);
  const [recentReports, setRecentReports] = useState<RelatorioResumo[]>([]);
  const [loadingRecentReports, setLoadingRecentReports] = useState(false);

  const loader = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const [overview, organizacoes, questionarios] = await Promise.all([
      dashboardApi.getOverview(token, { signal }),
      dashboardApi.listOrganizacoes(token, { signal }),
      dashboardApi.listQuestionariosStatus(token, { signal }),
    ]);

    return { overview, organizacoes, questionarios };
  }, [token]);

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  usePollingRefetch(refetch, { enabled: Boolean(token), intervalMs: 30_000 });

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm((current) => ({
      ...current,
      idQuestionario: current.idQuestionario || data.questionarios[0]?.id || "",
      idOrganizacao: current.idOrganizacao || data.organizacoes[0]?.id || "",
    }));
  }, [data]);

  const refreshRecentReports = useCallback(async () => {
    if (!token || !form.idQuestionario || !form.idOrganizacao) {
      setRecentReports([]);
      return;
    }

    setLoadingRecentReports(true);
    try {
      const result = await relatoriosApi.list(token, {
        questionarioId: form.idQuestionario,
        orgId: form.idOrganizacao,
        setorId: form.tipo === "setorial" ? form.idSetor || undefined : undefined,
        tipo: form.tipo,
        limit: 12,
      });
      setRecentReports(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar relatórios recentes.";
      setErrorMessage(message);
      setRecentReports([]);
    } finally {
      setLoadingRecentReports(false);
    }
  }, [token, form.idQuestionario, form.idOrganizacao, form.idSetor, form.tipo]);

  useEffect(() => {
    void refreshRecentReports();
  }, [refreshRecentReports]);

  useEffect(() => {
    if (!token || !form.idOrganizacao) {
      setSetores([]);
      setLoadingSetores(false);
      return;
    }

    const controller = new AbortController();

    const loadSetores = async () => {
      setLoadingSetores(true);
      try {
        const result = await dashboardApi.listSetores(token, form.idOrganizacao, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSetores(result);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setSetores([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSetores(false);
        }
      }
    };

    void loadSetores();

    return () => {
      controller.abort();
    };
  }, [token, form.idOrganizacao]);

  useEffect(() => {
    if (!token || !form.idQuestionario) {
      setMetricasQuestionario(null);
      return;
    }

    const controller = new AbortController();

    const loadQuestionarioMetrics = async () => {
      try {
        const result = await dashboardApi.getQuestionarioMetricas(form.idQuestionario, token, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setMetricasQuestionario(result);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setMetricasQuestionario(null);
        }
      }
    };

    void loadQuestionarioMetrics();

    return () => {
      controller.abort();
    };
  }, [token, form.idQuestionario]);

  const radarData = useMemo(() => {
    if (!relatorio) {
      return [];
    }

    return relatorio.dominios
      .map((dominio) => {
        const nome = dominio.nome || "Sem domínio";
        return {
          dominio: nome.length > 18 ? `${nome.slice(0, 18)}...` : nome,
          score: clamp(Math.round(toFiniteNumber(dominio.media_dominio) * 20), 0, 100),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [relatorio]);

  const distribuicaoDimensoes = useMemo(() => {
    if (!relatorio) {
      return [];
    }

    return relatorio.dominios
      .flatMap((dominio) => dominio.dimensoes)
      .map((dimensao) => {
        const favoravel = toFiniteNumber(dimensao.distribuicao?.favoravel);
        const intermediario = toFiniteNumber(dimensao.distribuicao?.intermediario);
        const risco = toFiniteNumber(dimensao.distribuicao?.risco);
        const total = favoravel + intermediario + risco || 1;
        const nome = dimensao.dimensao || "Sem dimensão";

        return {
          dimensao: nome.length > 22 ? `${nome.slice(0, 22)}...` : nome,
          favoravel: Number(((favoravel / total) * 100).toFixed(2)),
          intermediario: Number(((intermediario / total) * 100).toFixed(2)),
          risco: Number(((risco / total) * 100).toFixed(2)),
        };
      })
      .sort((a, b) => b.risco - a.risco)
      .slice(0, 8);
  }, [relatorio]);

  const heatmapData = useMemo(() => {
    if (!relatorio) {
      return [];
    }

    return relatorio.dominios.slice(0, 6).map((dominio) => ({
      dominio: dominio.nome || "Sem domínio",
      media: clamp(Math.round(toFiniteNumber(dominio.media_dominio) * 20), 0, 100),
      classificacao: dominio.classificacao_predominante,
    }));
  }, [relatorio]);

  const scorecards = useMemo(() => {
    if (relatorio) {
      return [
        {
          titulo: "Média de Risco Global",
          valor: toFiniteNumber(relatorio.metricas.mediaRiscoGlobal).toFixed(2),
          subtitulo: "Escala 0-4",
        },
        {
          titulo: "Índice de Proteção",
          valor: formatPercent(toFiniteNumber(relatorio.metricas.indiceProtecao)),
          subtitulo: "Fatores favoráveis",
        },
        {
          titulo: "Total Respondentes",
          valor: formatNumber(toFiniteNumber(relatorio.metricas.totalRespondentes)),
          subtitulo: "Base do relatório",
        },
      ];
    }

    if (!data) {
      return [];
    }

    return [
      {
        titulo: "Média de Risco Global (estimada)",
        valor: (4 - data.overview.taxa_conclusao_geral / 25).toFixed(2),
        subtitulo: "Estimativa baseada no overview",
      },
      {
        titulo: "Índice de Proteção (estimado)",
        valor: formatPercent(data.overview.taxa_conclusao_geral),
        subtitulo: "Taxa de conclusão geral",
      },
      {
        titulo: "Total Respondentes (potencial)",
        valor: formatNumber(data.overview.total_usuarios),
        subtitulo: "Base potencial",
      },
    ];
  }, [relatorio, data]);

  const loadReportById = useCallback(
    async (id: string) => {
      if (!token || !id) {
        return;
      }

      setLoadingRelatorio(true);
      setErrorMessage(null);

      try {
        const report = await relatoriosApi.getById(id, token);
        setRelatorio(report);
        setRelatorioId(id);
        setFeedback("Relatório carregado com sucesso.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível obter o relatório.";
        setErrorMessage(message);
      } finally {
        setLoadingRelatorio(false);
      }
    },
    [token],
  );

  const handleGenerateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (!form.idQuestionario || !form.idOrganizacao || (form.tipo === "setorial" && !form.idSetor)) {
      setErrorMessage("Preencha os filtros obrigatórios para gerar o relatório.");
      return;
    }

    setLoadingSubmit(true);
    setFeedback(null);
    setErrorMessage(null);

    const payload: GerarRelatorioRequest = {
      idQuestionario: form.idQuestionario,
      idOrganizacao: form.idOrganizacao,
      idSetor: form.tipo === "setorial" ? form.idSetor : undefined,
      tipo: form.tipo,
    };

    try {
      const response = await relatoriosApi.gerar(payload, token);
      setFeedback(response.message);
      setRelatorioId(response.id);
      await Promise.all([loadReportById(response.id), refreshRecentReports()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao gerar relatório.";
      setErrorMessage(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGenerateReportAsync = async () => {
    if (!token) {
      return;
    }

    if (!form.idQuestionario || !form.idOrganizacao || (form.tipo === "setorial" && !form.idSetor)) {
      setErrorMessage("Preencha os filtros obrigatórios para geração assíncrona.");
      return;
    }

    setLoadingAsyncSubmit(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await relatoriosApi.gerarAsync(
        {
          idQuestionario: form.idQuestionario,
          idOrganizacao: form.idOrganizacao,
          idSetor: form.tipo === "setorial" ? form.idSetor : undefined,
          tipo: form.tipo,
        },
        token,
      );

      setFeedback(`${response.message} Task ID: ${response.task_id}`);
      await refreshRecentReports();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar geração assíncrona.";
      setErrorMessage(message);
    } finally {
      setLoadingAsyncSubmit(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!token) {
      return;
    }
    if (!relatorio?.id) {
      setErrorMessage("Carregue um relatório antes de exportar.");
      return;
    }
    if (!isSupportedExportFormat(format)) {
      setErrorMessage("Formato de exportação não suportado nesta tela.");
      return;
    }

    setLoadingExport(format);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const exported = await relatoriosApi.exportById(relatorio.id, format, token);
      triggerDownload(exported.blob, exported.filename);
      setFeedback(`Arquivo ${exported.filename} gerado com sucesso.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao exportar relatório.";
      setErrorMessage(message);
    } finally {
      setLoadingExport(null);
    }
  };

  if (loading) {
    return <LoadingState label="Carregando base de relatórios..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || "Falha ao carregar dados para relatórios."} onRetry={refetch} />;
  }

  const hasDistribuicaoDimensoesData = distribuicaoDimensoes.some(
    (item) => item.favoravel > 0 || item.intermediario > 0 || item.risco > 0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Relatórios Consolidados</h1>
          <p className="mt-1 text-slate-600">Fluxo em 3 passos: configurar, gerar/carregar e exportar.</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <RefreshingIndicator active={refreshing} />
          <ExportButton
            onExport={(format) => void handleExport(format)}
            formats={["pdf", "excel", "csv"]}
            label={loadingExport ? `Exportando ${loadingExport.toUpperCase()}...` : "Exportar relatório"}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card padding="sm">
          <div className="flex items-start gap-2">
            <Badge variant="default">1</Badge>
            <div>
              <p className="font-semibold text-slate-900">Defina o escopo</p>
              <p className="text-sm text-slate-600">Selecione questionário, organização e tipo.</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start gap-2">
            <Badge variant="default">2</Badge>
            <div>
              <p className="font-semibold text-slate-900">Gere ou carregue</p>
              <p className="text-sm text-slate-600">Use geração síncrona ou escolha um relatório recente.</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start gap-2">
            <Badge variant="default">3</Badge>
            <div>
              <p className="font-semibold text-slate-900">Analise e exporte</p>
              <p className="text-sm text-slate-600">Baixe em PDF, CSV ou Excel.</p>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-slate-900">Configuração de Geração</h2>
            <Badge variant="media">{formatTipoRelatorio(form.tipo)}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Questionário</span>
              <select
                value={form.idQuestionario}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idQuestionario: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Selecione</option>
                {data.questionarios.map((questionario) => (
                  <option key={questionario.id} value={questionario.id}>
                    {questionario.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Organização</span>
              <select
                value={form.idOrganizacao}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idOrganizacao: event.target.value,
                    idSetor: "",
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Selecione</option>
                {data.organizacoes.map((organizacao) => (
                  <option key={organizacao.id} value={organizacao.id}>
                    {organizacao.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Tipo</span>
              <select
                value={form.tipo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tipo: event.target.value as ReportFormState["tipo"],
                    idSetor: "",
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="organizacional">Organizacional</option>
                <option value="setorial">Setorial</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">
                Setor {form.tipo === "setorial" ? "(obrigatório)" : "(opcional)"}
              </span>
              <select
                value={form.idSetor}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idSetor: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!form.idOrganizacao || loadingSetores}
                required={form.tipo === "setorial"}
              >
                <option value="">{loadingSetores ? "Carregando..." : "Selecione"}</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loadingSubmit}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSubmit ? "Gerando..." : "Gerar agora"}
            </button>

            <button
              type="button"
              disabled={loadingAsyncSubmit}
              onClick={handleGenerateReportAsync}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAsyncSubmit ? "Enviando..." : "Enviar para fila (async)"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-slate-900">Relatórios Recentes no Escopo</h3>
          <button
            type="button"
            onClick={() => void refreshRecentReports()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Atualizar lista
          </button>
        </div>

        {loadingRecentReports ? (
          <div className="py-6 text-sm text-slate-500">Carregando relatórios...</div>
        ) : recentReports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Respondentes</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Risco Global</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Proteção</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-sm text-slate-700">{formatDateTime(item.dataGeracao)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="default">{formatTipoRelatorio(item.tipoRelatorio)}</Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {formatNumber(toFiniteNumber(item.metricas.totalRespondentes))}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">{toFiniteNumber(item.metricas.mediaRiscoGlobal).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{formatPercent(toFiniteNumber(item.metricas.indiceProtecao))}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void loadReportById(item.id)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Carregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-sm text-slate-500">Nenhum relatório encontrado para os filtros atuais.</div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Abrir relatório por ID (opcional)</span>
            <input
              value={relatorioId}
              onChange={(event) => setRelatorioId(event.target.value)}
              placeholder="ID do relatório"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadReportById(relatorioId)}
            disabled={loadingRelatorio || !relatorioId}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingRelatorio ? "Consultando..." : "Buscar por ID"}
          </button>
        </div>
      </Card>

      {feedback && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p>}
      {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>}

      {relatorio ? (
        <Card>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Relatório carregado</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{relatorio.id}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatTipoRelatorio(relatorio.tipoRelatorio)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Gerado em</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(relatorio.dataGeracao)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Status</p>
              <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <FileSpreadsheet className="h-4 w-4" />
                pronto para exportação
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Clock4 className="mt-0.5 h-4 w-4 text-slate-500" />
            Carregue um relatório para habilitar exportação e análises completas dos gráficos.
          </div>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {scorecards.map((card) => (
          <Card key={card.titulo}>
            <p className="text-sm text-slate-600">{card.titulo}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{card.valor}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              {card.subtitulo}
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Radar Hexagonal por Domínio</h3>
          <RadarScoreChart data={radarData} height={340} />
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição por Dimensão</h3>
          {hasDistribuicaoDimensoesData ? (
            <VerticalStackedDistributionChart data={distribuicaoDimensoes} height={340} yAxisWidth={170} />
          ) : (
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
              Gere ou consulte um relatório para visualizar este gráfico.
            </div>
          )}
        </Card>
      </section>

      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Mapa de calor por domínio</h3>
        {heatmapData.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Domínio</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Classificação</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.dominio} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.dominio}</td>
                    <td className="px-4 py-3">
                      <div
                        className="mx-auto flex h-10 w-full max-w-[150px] items-center justify-center rounded font-semibold text-white"
                        style={{ backgroundColor: getHeatColor(row.media) }}
                      >
                        {row.media}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          row.classificacao === "favoravel"
                            ? "favoravel"
                            : row.classificacao === "intermediario"
                              ? "intermediario"
                              : "risco"
                        }
                      >
                        {String(row.classificacao).toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Gere ou consulte um relatório para visualizar o mapa de calor.</p>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-display text-lg font-semibold text-slate-900">Recomendações priorizadas</h3>
        </div>
        <div className="space-y-3">
          {relatorio?.recomendacoes?.length ? (
            relatorio.recomendacoes.map((recomendacao, index) => (
              <div key={`${recomendacao}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">Ação {index + 1}</p>
                  <Badge variant={index < 2 ? "alta" : "media"}>{index < 2 ? "ALTA" : "MÉDIA"}</Badge>
                </div>
                <p className="text-sm text-slate-600">{recomendacao}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Sem recomendações disponíveis. Gere um relatório para obter sugestões automáticas.</p>
          )}
        </div>
      </Card>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p>
          <strong>Contexto atual:</strong>{" "}
          {relatorio ? "dados derivados de relatório gerado" : "dados de overview e métricas de questionário"}.
          Última atualização geral: {formatDateTime(data.overview.ultima_atualizacao)}.
        </p>
        {metricasQuestionario && (
          <p className="mt-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Classificação atual do questionário selecionado: favorável{" "}
            {formatNumber(metricasQuestionario.distribuicao_classificacoes.favoravel || 0)}, intermediário{" "}
            {formatNumber(metricasQuestionario.distribuicao_classificacoes.intermediario || 0)}, risco{" "}
            {formatNumber(metricasQuestionario.distribuicao_classificacoes.risco || 0)}.
          </p>
        )}
      </section>
    </div>
  );
}
