"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Clock4,
  FileSpreadsheet,
  FolderTree,
  TrendingUp,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExportButton, type ExportFormat } from "@/components/ui/ExportButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, relatoriosApi } from "@/lib/api";
import {
  GerarRelatorioRequest,
  Relatorio,
  RelatorioExportFormat,
  SetorDashboard,
  UsuarioAtivo,
} from "@/lib/types/api";
import { clamp, formatDateTime, formatNumber, formatPercent } from "@/lib/utils/format";
import { generateReportPdf } from "@/lib/utils/generatePdf";
import { useAsyncData } from "@/lib/utils/useAsyncData";
import { usePollingRefetch } from "@/lib/utils/usePollingRefetch";

type ReportTab = "empresa" | "setor" | "pessoa";

interface ReportFormState {
  idQuestionario: string;
  idOrganizacao: string;
  idSetor: string;
  anonId: string;
  tipo: "organizacional" | "setorial" | "individual";
}

const RadarScoreChart = dynamic(
  () => import("@/components/charts/RadarScoreChart").then((m) => m.RadarScoreChart),
  {
    ssr: false,
    loading: () => <div className="h-[340px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

const VerticalStackedDistributionChart = dynamic(
  () =>
    import("@/components/charts/VerticalStackedDistributionChart").then(
      (m) => m.VerticalStackedDistributionChart,
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
  if (error instanceof DOMException) return error.name === "AbortError";
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function getHeatColor(value: number): string {
  if (value >= 70) return "#ef4444";
  if (value >= 50) return "#f59e0b";
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
  if (tipo === "individual") return "Individual";
  return tipo === "setorial" ? "Setorial" : "Organizacional";
}

const TAB_CONFIG: { key: ReportTab; label: string; icon: typeof Building2; tipo: ReportFormState["tipo"] }[] = [
  { key: "empresa", label: "Por Empresa", icon: Building2, tipo: "organizacional" },
  { key: "setor", label: "Por Setor", icon: FolderTree, tipo: "setorial" },
  { key: "pessoa", label: "Por Pessoa", icon: User, tipo: "individual" },
];

export default function RelatoriosPage() {
  const { token } = useAuth();
  const printableRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<ReportTab>("empresa");
  const [form, setForm] = useState<ReportFormState>({
    idQuestionario: "",
    idOrganizacao: "",
    idSetor: "",
    anonId: "",
    tipo: "organizacional",
  });

  const [setores, setSetores] = useState<SetorDashboard[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingExport, setLoadingExport] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  // Modal for looking up by ID
  const [showIdModal, setShowIdModal] = useState(false);
  const [relatorioIdInput, setRelatorioIdInput] = useState("");

  const loader = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");
      const [overview, organizacoes, questionarios] = await Promise.all([
        dashboardApi.getOverview(token, { signal }),
        dashboardApi.listOrganizacoes(token, { signal }),
        dashboardApi.listQuestionariosStatus(token, { signal }),
      ]);
      return { overview, organizacoes, questionarios };
    },
    [token],
  );

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  usePollingRefetch(refetch, { enabled: Boolean(token), intervalMs: 30_000 });

  useEffect(() => {
    if (!data) return;
    setForm((cur) => ({
      ...cur,
      idQuestionario: cur.idQuestionario || data.questionarios[0]?.id || "",
      idOrganizacao: cur.idOrganizacao || data.organizacoes[0]?.id || "",
    }));
  }, [data]);

  // Load setores when org changes
  useEffect(() => {
    if (!token || !form.idOrganizacao) {
      setSetores([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoadingSetores(true);
      try {
        const result = await dashboardApi.listSetores(token, form.idOrganizacao, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setSetores(result);
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) setSetores([]);
      } finally {
        if (!controller.signal.aborted) setLoadingSetores(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [token, form.idOrganizacao]);

  // Load usuarios when org/setor changes (for "pessoa" tab)
  useEffect(() => {
    if (!token || !form.idOrganizacao || activeTab !== "pessoa") {
      setUsuarios([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoadingUsuarios(true);
      try {
        const result = await dashboardApi.listUsuariosAtivos(
          token,
          { orgId: form.idOrganizacao, setorId: form.idSetor || undefined },
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) setUsuarios(result);
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) setUsuarios([]);
      } finally {
        if (!controller.signal.aborted) setLoadingUsuarios(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [token, form.idOrganizacao, form.idSetor, activeTab]);

  // Tab switching updates form.tipo
  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    const cfg = TAB_CONFIG.find((t) => t.key === tab)!;
    setForm((cur) => ({ ...cur, tipo: cfg.tipo, idSetor: "", anonId: "" }));
    setRelatorio(null);
    setFeedback(null);
    setErrorMessage(null);
  };

  const radarData = useMemo(() => {
    if (!relatorio) return [];
    return relatorio.dominios
      .map((d) => ({
        dominio: (d.nome || "").length > 18 ? `${(d.nome || "").slice(0, 18)}...` : d.nome || "Sem domínio",
        score: clamp(Math.round(toFiniteNumber(d.media_dominio) * 20), 0, 100),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [relatorio]);

  const distribuicaoDimensoes = useMemo(() => {
    if (!relatorio) return [];
    return relatorio.dominios
      .flatMap((d) => d.dimensoes)
      .map((dim) => {
        const f = toFiniteNumber(dim.distribuicao?.favoravel);
        const i = toFiniteNumber(dim.distribuicao?.intermediario);
        const r = toFiniteNumber(dim.distribuicao?.risco);
        const total = f + i + r || 1;
        const nome = dim.dimensao || "Sem dimensão";
        return {
          dimensao: nome.length > 22 ? `${nome.slice(0, 22)}...` : nome,
          favoravel: Number(((f / total) * 100).toFixed(2)),
          intermediario: Number(((i / total) * 100).toFixed(2)),
          risco: Number(((r / total) * 100).toFixed(2)),
        };
      })
      .sort((a, b) => b.risco - a.risco)
      .slice(0, 8);
  }, [relatorio]);

  const heatmapData = useMemo(() => {
    if (!relatorio) return [];
    return relatorio.dominios.slice(0, 6).map((d) => ({
      dominio: d.nome || "Sem domínio",
      media: clamp(Math.round(toFiniteNumber(d.media_dominio) * 20), 0, 100),
      classificacao: d.classificacao_predominante,
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
    return [];
  }, [relatorio]);

  const hasDistribuicaoDimensoesData = distribuicaoDimensoes.some(
    (item) => item.favoravel > 0 || item.intermediario > 0 || item.risco > 0,
  );

  // Resolve display names for PDF
  const orgName = data?.organizacoes.find((o) => o.id === form.idOrganizacao)?.nome;
  const setorName = setores.find((s) => s.id === form.idSetor)?.nome;
  const userName = usuarios.find((u) => u.id === form.anonId)?.telefone_mascarado;

  const loadReportById = useCallback(
    async (id: string) => {
      if (!token || !id) return;
      setLoadingRelatorio(true);
      setErrorMessage(null);
      try {
        const report = await relatoriosApi.getById(id, token);
        setRelatorio(report);
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
    if (!token) return;

    if (!form.idQuestionario || !form.idOrganizacao) {
      setErrorMessage("Selecione questionário e organização.");
      return;
    }
    if (activeTab === "setor" && !form.idSetor) {
      setErrorMessage("Selecione um setor para relatório setorial.");
      return;
    }
    if (activeTab === "pessoa" && !form.anonId) {
      setErrorMessage("Selecione um usuário para relatório individual.");
      return;
    }

    setLoadingSubmit(true);
    setFeedback(null);
    setErrorMessage(null);

    const payload: GerarRelatorioRequest = {
      idQuestionario: form.idQuestionario,
      idOrganizacao: form.idOrganizacao,
      idSetor: activeTab !== "empresa" ? form.idSetor || undefined : undefined,
      anonId: activeTab === "pessoa" ? form.anonId : undefined,
      tipo: form.tipo,
    };

    try {
      const response = await relatoriosApi.gerar(payload, token);
      setFeedback(response.message);
      await loadReportById(response.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao gerar relatório.";
      setErrorMessage(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!token) return;

    if (format === "pdf-graficos") {
      if (!relatorio) {
        setErrorMessage("Gere um relatório antes de exportar.");
        return;
      }
      setLoadingExport("pdf-graficos");
      setErrorMessage(null);
      try {
        // Render the printable report off-screen, capture, and generate PDF
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.zIndex = "-1";
        document.body.appendChild(container);

        // We need to render the PrintableReport into this container
        // Using a simpler approach: use the ref if visible, or create inline
        const { createRoot } = await import("react-dom/client");
        const { createElement } = await import("react");

        const root = createRoot(container);
        await new Promise<void>((resolve) => {
          root.render(
            createElement(PrintableReport, {
              relatorio,
              orgName,
              setorName,
              userName,
              ref: (el: HTMLDivElement | null) => {
                if (el) {
                  // Wait for Recharts to render
                  setTimeout(async () => {
                    try {
                      await generateReportPdf(
                        el,
                        `relatorio_${relatorio.id}.pdf`,
                      );
                      setFeedback("PDF com gráficos gerado com sucesso.");
                    } catch (pdfErr) {
                      const msg = pdfErr instanceof Error ? pdfErr.message : "Falha ao gerar PDF.";
                      setErrorMessage(msg);
                    } finally {
                      root.unmount();
                      document.body.removeChild(container);
                      setLoadingExport(null);
                    }
                    resolve();
                  }, 1500);
                }
              },
            }),
          );
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao gerar PDF com gráficos.";
        setErrorMessage(message);
        setLoadingExport(null);
      }
      return;
    }

    if (!relatorio?.id) {
      setErrorMessage("Gere um relatório antes de exportar.");
      return;
    }
    if (!isSupportedExportFormat(format)) {
      setErrorMessage("Formato de exportação não suportado.");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Relatórios</h1>
          <p className="mt-1 text-slate-600">
            Selecione o tipo de relatório, configure os filtros e gere.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshingIndicator active={refreshing} />
          <button
            type="button"
            onClick={() => setShowIdModal(true)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Buscar por ID
          </button>
          {relatorio && (
            <ExportButton
              onExport={(format) => void handleExport(format)}
              formats={["pdf-graficos", "excel", "csv"]}
              label={loadingExport ? "Exportando..." : "Exportar"}
            />
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Relatório {formatTipoRelatorio(form.tipo)}
            </h2>
            <Badge variant="media">{formatTipoRelatorio(form.tipo)}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Questionário - always visible */}
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Questionário</span>
              <select
                value={form.idQuestionario}
                onChange={(e) => setForm((c) => ({ ...c, idQuestionario: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Selecione</option>
                {data.questionarios.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.nome}
                  </option>
                ))}
              </select>
            </label>

            {/* Organização - always visible */}
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Organização</span>
              <select
                value={form.idOrganizacao}
                onChange={(e) =>
                  setForm((c) => ({ ...c, idOrganizacao: e.target.value, idSetor: "", anonId: "" }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Selecione</option>
                {data.organizacoes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </label>

            {/* Setor - visible for "setor" and "pessoa" tabs */}
            {(activeTab === "setor" || activeTab === "pessoa") && (
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-slate-700">
                  Setor {activeTab === "setor" ? "(obrigatório)" : "(opcional)"}
                </span>
                <select
                  value={form.idSetor}
                  onChange={(e) => setForm((c) => ({ ...c, idSetor: e.target.value, anonId: "" }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!form.idOrganizacao || loadingSetores}
                  required={activeTab === "setor"}
                >
                  <option value="">{loadingSetores ? "Carregando..." : "Selecione"}</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Usuário - visible only for "pessoa" tab */}
            {activeTab === "pessoa" && (
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Usuário (obrigatório)</span>
                <select
                  value={form.anonId}
                  onChange={(e) => setForm((c) => ({ ...c, anonId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!form.idOrganizacao || loadingUsuarios}
                  required
                >
                  <option value="">{loadingUsuarios ? "Carregando..." : "Selecione"}</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.telefone_mascarado} - {u.status}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BarChart3 className="h-4 w-4" />
            {loadingSubmit ? "Gerando relatório..." : "Gerar Relatório"}
          </button>
        </form>
      </Card>

      {/* Feedback & Error */}
      {feedback && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </p>
      )}
      {errorMessage && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {/* Loading indicator for report */}
      {loadingRelatorio && (
        <Card>
          <div className="flex items-center gap-3 py-4 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Carregando relatório...
          </div>
        </Card>
      )}

      {/* Report loaded info */}
      {relatorio && (
        <>
          <Card>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Relatório</p>
                <p className="mt-1 font-mono text-xs text-slate-700">{relatorio.id}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Tipo</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatTipoRelatorio(relatorio.tipoRelatorio)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Gerado em</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(relatorio.dataGeracao)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Exportar</p>
                <div className="mt-1">
                  <ExportButton
                    onExport={(format) => void handleExport(format)}
                    formats={["pdf-graficos", "excel", "csv"]}
                    label={loadingExport ? "Exportando..." : "Exportar"}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Scorecards */}
          {scorecards.length > 0 && (
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
          )}

          {/* Charts */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">
                Radar Hexagonal por Domínio
              </h3>
              <RadarScoreChart data={radarData} height={340} />
            </Card>

            <Card>
              <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">
                Distribuição por Dimensão
              </h3>
              {hasDistribuicaoDimensoesData ? (
                <VerticalStackedDistributionChart data={distribuicaoDimensoes} height={340} yAxisWidth={170} />
              ) : (
                <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
                  Sem dados de distribuição para este relatório.
                </div>
              )}
            </Card>
          </section>

          {/* Heatmap */}
          <Card>
            <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">
              Mapa de calor por domínio
            </h3>
            {heatmapData.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Domínio</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Score</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                        Classificação
                      </th>
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
              <p className="text-sm text-slate-500">Sem dados de mapa de calor.</p>
            )}
          </Card>

          {/* Recomendações */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Recomendações priorizadas
              </h3>
            </div>
            <div className="space-y-3">
              {relatorio.recomendacoes?.length ? (
                relatorio.recomendacoes.map((rec, idx) => (
                  <div key={`${rec}-${idx}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">Ação {idx + 1}</p>
                      <Badge variant={idx < 2 ? "alta" : "media"}>{idx < 2 ? "ALTA" : "MÉDIA"}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{rec}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sem recomendações disponíveis.</p>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Empty state when no report loaded */}
      {!relatorio && !loadingRelatorio && (
        <Card>
          <div className="flex items-start gap-2 py-4 text-sm text-slate-600">
            <Clock4 className="mt-0.5 h-4 w-4 text-slate-500" />
            Configure os filtros acima e clique em &quot;Gerar Relatório&quot; para visualizar os
            resultados.
          </div>
        </Card>
      )}

      {/* Context footer */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p>
          <strong>Contexto atual:</strong>{" "}
          {relatorio ? "dados derivados de relatório gerado" : "aguardando geração de relatório"}.
          Última atualização geral: {formatDateTime(data.overview.ultima_atualizacao)}.
        </p>
      </section>

      {/* ID Lookup Modal */}
      {showIdModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowIdModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">
              Buscar relatório por ID
            </h3>
            <input
              value={relatorioIdInput}
              onChange={(e) => setRelatorioIdInput(e.target.value)}
              placeholder="ID do relatório"
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIdModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!relatorioIdInput || loadingRelatorio}
                onClick={async () => {
                  await loadReportById(relatorioIdInput);
                  setShowIdModal(false);
                  setRelatorioIdInput("");
                }}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {loadingRelatorio ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
