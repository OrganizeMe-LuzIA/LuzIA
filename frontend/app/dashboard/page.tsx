"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { AlertCard } from "@/components/ui/AlertCard";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";
import { dashboardApi } from "@/lib/api";
import { QuestionarioMetricas } from "@/lib/types/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";
import { usePollingRefetch } from "@/lib/utils/usePollingRefetch";

const riskColors = {
  favoravel: "#10b981",
  intermediario: "#f59e0b",
  risco: "#ef4444",
};

const PieClassificationChart = dynamic(
  () => import("@/components/charts/PieClassificationChart").then((module) => module.PieClassificationChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

const VerticalSingleBarChart = dynamic(
  () => import("@/components/charts/VerticalSingleBarChart").then((module) => module.VerticalSingleBarChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

const EMPTY_CHART_COLOR = "#cbd5e1";

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

export default function DashboardPage() {
  const { token } = useAuth();
  const { filters } = useDashboardFilters();
  const [metricas, setMetricas] = useState<QuestionarioMetricas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const loader = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const [overview, setores] = await Promise.all([
      dashboardApi.getOverview(token, { signal }),
      dashboardApi.listSetores(token, filters.orgId || undefined, { signal }),
    ]);

    return { overview, setores };
  }, [token, filters.orgId]);

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  usePollingRefetch(refetch, { enabled: Boolean(token), intervalMs: 30_000 });

  useEffect(() => {
    if (!token) {
      setMetricas(null);
      setLoadingMetricas(false);
      return;
    }

    const controller = new AbortController();
    setLoadingMetricas(true);

    const loadMetricas = async () => {
      try {
        let selectedQuestionarioId = filters.questionarioId;

        if (!selectedQuestionarioId) {
          const questionarios = await dashboardApi.listQuestionariosStatus(token, {
            signal: controller.signal,
          });
          selectedQuestionarioId = questionarios[0]?.id || "";
        }

        if (!selectedQuestionarioId || controller.signal.aborted) {
          if (!controller.signal.aborted) {
            setMetricas(null);
          }
          return;
        }

        const metricasResult = await dashboardApi.getQuestionarioMetricas(selectedQuestionarioId, token, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setMetricas(metricasResult);
        }
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }
        setMetricas(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMetricas(false);
        }
      }
    };

    void loadMetricas();

    return () => {
      controller.abort();
    };
  }, [token, filters.questionarioId]);

  const kpis = useMemo(() => {
    if (!data) {
      return [];
    }

    const { overview } = data;
    return [
      {
        title: "Total de Organizações",
        value: formatNumber(overview.total_organizacoes),
        icon: <Building2 className="h-6 w-6" />,
      },
      {
        title: "Total de Setores",
        value: formatNumber(overview.total_setores),
        icon: <Users className="h-6 w-6" />,
      },
      {
        title: "Usuários em Andamento",
        value: formatNumber(overview.usuarios_ativos),
        icon: <Activity className="h-6 w-6" />,
      },
      {
        title: "Questionários em Andamento",
        value: formatNumber(overview.questionarios_em_andamento),
        icon: <FileText className="h-6 w-6" />,
      },
      {
        title: "Taxa de Conclusão Geral",
        value: formatPercent(overview.taxa_conclusao_geral),
        icon: <CheckCircle2 className="h-6 w-6" />,
      },
      {
        title: "Total de Usuários",
        value: formatNumber(overview.total_usuarios),
        icon: <TrendingUp className="h-6 w-6" />,
      },
    ];
  }, [data]);

  const riskData = useMemo(() => {
    const distribuicao = metricas?.distribuicao_classificacoes || {
      favoravel: 0,
      intermediario: 0,
      risco: 0,
    };

    return [
      { name: "Favorável", value: toFiniteNumber(distribuicao.favoravel), color: riskColors.favoravel },
      { name: "Intermediário", value: toFiniteNumber(distribuicao.intermediario), color: riskColors.intermediario },
      { name: "Risco", value: toFiniteNumber(distribuicao.risco), color: riskColors.risco },
    ];
  }, [metricas]);

  const setoresChartData = useMemo(
    () =>
      [...(data?.setores || [])]
        .sort((a, b) => toFiniteNumber(b.usuarios_ativos) - toFiniteNumber(a.usuarios_ativos))
        .slice(0, 8)
        .map((setor) => ({
          nome: setor.nome.length > 18 ? `${setor.nome.slice(0, 18)}...` : setor.nome,
          respostas: toFiniteNumber(setor.usuarios_ativos),
        })),
    [data],
  );

  const hasRiskData = riskData.some((entry) => entry.value > 0);
  const hasSetoresData = setoresChartData.some((entry) => entry.respostas > 0);
  const riskChartData = hasRiskData
    ? riskData
    : [{ name: "Sem dados", value: 1, color: EMPTY_CHART_COLOR }];

  if (loading) {
    return <LoadingState label="Carregando visão geral do dashboard..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || "Falha ao carregar o dashboard."} onRetry={refetch} />;
  }

  const { overview } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-slate-600">Visão geral da saúde psicossocial organizacional</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <RefreshingIndicator active={refreshing || loadingMetricas} />
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Atualizado em {formatDateTime(overview.ultima_atualizacao)}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição de Classificações COPSOQ</h3>
          {loadingMetricas && !metricas ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <PieClassificationChart data={riskChartData} height={300} outerRadius={100} showLabel={hasRiskData} />
          )}
          {!loadingMetricas && !hasRiskData && (
            <p className="text-center text-sm text-slate-500">Ainda não há diagnósticos suficientes para este gráfico.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Usuários em Andamento por Setor</h3>
          {hasSetoresData ? (
            <VerticalSingleBarChart
              data={setoresChartData}
              valueKey="respostas"
              labelKey="nome"
              height={300}
              yAxisWidth={120}
              fill="#14b8a6"
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Nenhum setor com usuários em andamento para exibir.
            </div>
          )}
        </Card>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-slate-900">Alertas e Notificações</h3>
        <div className="space-y-3">
          {overview.alertas.length === 0 ? (
            <Card className="text-sm text-slate-600">Nenhum alerta crítico no momento.</Card>
          ) : (
            overview.alertas.map((alerta, index) => (
              <AlertCard
                key={`${alerta.tipo}-${index}`}
                titulo={alerta.tipo.replaceAll("_", " ").toUpperCase()}
                descricao={alerta.mensagem}
                severidade={
                  alerta.severidade === "alta" || alerta.severidade === "media" || alerta.severidade === "baixa"
                    ? alerta.severidade
                    : "media"
                }
                ultimaAtualizacao={formatDateTime(overview.ultima_atualizacao)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
