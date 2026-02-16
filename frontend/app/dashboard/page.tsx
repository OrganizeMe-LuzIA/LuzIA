"use client";

import { useCallback, useMemo } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "@/components/ui/KPICard";
import { AlertCard } from "@/components/ui/AlertCard";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";
import { dashboardApi } from "@/lib/api";
import { QuestionarioMetricas } from "@/lib/types/api";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";

const riskColors = {
  favoravel: "#10b981",
  intermediario: "#f59e0b",
  risco: "#ef4444",
};

const EMPTY_CHART_COLOR = "#cbd5e1";

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const { filters } = useDashboardFilters();

  const loader = useCallback(async () => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const [overview, setores, questionarios] = await Promise.all([
      dashboardApi.getOverview(token),
      dashboardApi.listSetores(token, filters.orgId || undefined),
      dashboardApi.listQuestionariosStatus(token),
    ]);

    let metricas: QuestionarioMetricas | null = null;
    const selectedQuestionario = filters.questionarioId || questionarios[0]?.id;
    if (selectedQuestionario) {
      try {
        metricas = await dashboardApi.getQuestionarioMetricas(selectedQuestionario, token);
      } catch {
        metricas = null;
      }
    }

    return { overview, setores, metricas };
  }, [token, filters.orgId, filters.questionarioId]);

  const { data, loading, error, refetch } = useAsyncData(loader, [loader]);

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
        title: "Usuários Ativos",
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
    const distribuicao = data?.metricas?.distribuicao_classificacoes || {
      favoravel: 0,
      intermediario: 0,
      risco: 0,
    };

    return [
      { name: "Favorável", value: toFiniteNumber(distribuicao.favoravel), color: riskColors.favoravel },
      { name: "Intermediário", value: toFiniteNumber(distribuicao.intermediario), color: riskColors.intermediario },
      { name: "Risco", value: toFiniteNumber(distribuicao.risco), color: riskColors.risco },
    ];
  }, [data]);

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
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <BarChart3 className="h-4 w-4 text-teal-600" />
          Atualizado em {formatDateTime(overview.ultima_atualizacao)}
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskChartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={hasRiskData ? ({ name, value }) => `${name} ${value}` : false}
                labelLine={false}
              >
                {riskChartData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {!hasRiskData && (
            <p className="text-center text-sm text-slate-500">Ainda não há diagnósticos suficientes para este gráfico.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Usuários Ativos por Setor</h3>
          {hasSetoresData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={setoresChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="nome" width={120} />
                <Tooltip />
                <Bar dataKey="respostas" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Nenhum setor com usuários ativos para exibir.
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
