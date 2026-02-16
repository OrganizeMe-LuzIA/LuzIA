"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, FileText, TrendingUp, Users } from "lucide-react";
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
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/lib/api";
import { QuestionarioMetricas, QuestionarioStatus } from "@/lib/types/api";
import { average, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";

const chartColors = {
  favoravel: "#10b981",
  intermediario: "#f59e0b",
  risco: "#ef4444",
};

export default function QuestionariosPage() {
  const { token } = useAuth();

  const [selectedQuestionario, setSelectedQuestionario] = useState<QuestionarioStatus | null>(null);
  const [metricas, setMetricas] = useState<QuestionarioMetricas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const loader = useCallback(async () => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    return dashboardApi.listQuestionariosStatus(token);
  }, [token]);

  const { data, loading, error, refetch } = useAsyncData(loader, [loader]);
  const questionarios = data || [];

  const stats = useMemo(() => {
    const respostasTotais = questionarios.reduce((sum, questionario) => sum + questionario.total_respostas_completas, 0);
    const taxaMedia = average(questionarios.map((questionario) => questionario.taxa_conclusao));
    const usuariosParticipantes = Math.max(...questionarios.map((questionario) => questionario.total_usuarios_atribuidos), 0);

    return {
      totalQuestionarios: questionarios.length,
      respostasTotais,
      taxaMedia,
      usuariosParticipantes,
    };
  }, [questionarios]);

  const columns: Column<QuestionarioStatus>[] = [
    {
      key: "nome",
      label: "Questionário",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
            <FileText className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{String(value)}</p>
            <p className="text-xs text-slate-500">
              v{row.versao} {row.codigo ? `• ${row.codigo}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "total_usuarios_atribuidos",
      label: "Usuários Atribuídos",
      sortable: true,
      render: (value) => formatNumber(Number(value || 0)),
    },
    {
      key: "total_respostas_completas",
      label: "Respostas Completas",
      sortable: true,
      render: (value, row) => {
        const respostas = Number(value || 0);
        const percentual = row.total_usuarios_atribuidos ? (respostas / row.total_usuarios_atribuidos) * 100 : 0;

        return (
          <div>
            <p className="font-medium text-slate-900">{formatNumber(respostas)}</p>
            <p className="text-xs text-slate-500">{formatPercent(percentual)} do total</p>
          </div>
        );
      },
    },
    {
      key: "taxa_conclusao",
      label: "Taxa de Conclusão",
      sortable: true,
      render: (value) => {
        const taxa = Number(value || 0);
        const barClass = taxa >= 80 ? "bg-emerald-500" : taxa >= 60 ? "bg-amber-500" : "bg-rose-500";

        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-full max-w-[120px] rounded-full bg-slate-200">
              <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${taxa}%` }} />
            </div>
            <span className="text-sm font-medium text-slate-700">{formatPercent(taxa)}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: () => <Badge variant="ativo">ATIVO</Badge>,
    },
    {
      key: "acoes",
      label: "Ações",
      render: (_, row) => (
        <button
          onClick={async (event) => {
            event.stopPropagation();
            if (!token) {
              return;
            }

            setSelectedQuestionario(row);
            setLoadingMetricas(true);
            setMetricas(null);

            try {
              const metrics = await dashboardApi.getQuestionarioMetricas(row.id, token);
              setMetricas(metrics);
            } finally {
              setLoadingMetricas(false);
            }
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-teal-700 transition-colors hover:bg-teal-50"
        >
          Ver métricas
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingState label="Carregando questionários..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const distribuicaoClassificacoes = metricas
    ? [
        { name: "Favorável", value: metricas.distribuicao_classificacoes.favoravel || 0, color: chartColors.favoravel },
        { name: "Intermediário", value: metricas.distribuicao_classificacoes.intermediario || 0, color: chartColors.intermediario },
        { name: "Risco", value: metricas.distribuicao_classificacoes.risco || 0, color: chartColors.risco },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Questionários</h1>
        <p className="mt-1 text-slate-600">Gestão e métricas dos questionários COPSOQ II</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card padding="sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-600">Total de Questionários</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.totalQuestionarios)}</p>
            </div>
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-600">Respostas Totais</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.respostasTotais)}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-600">Taxa Média de Conclusão</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(stats.taxaMedia)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-teal-600" />
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-600">Usuários Participantes</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.usuariosParticipantes)}</p>
            </div>
            <Users className="h-8 w-8 text-teal-600" />
          </div>
        </Card>
      </section>

      <Card padding="none">
        <DataTable columns={columns} data={questionarios} />
      </Card>

      {selectedQuestionario && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="mx-auto my-6 w-full max-w-5xl rounded-xl border border-slate-200 bg-white">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900">{selectedQuestionario.nome}</h2>
                <p className="text-sm text-slate-600">
                  v{selectedQuestionario.versao} {selectedQuestionario.codigo ? `• ${selectedQuestionario.codigo}` : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedQuestionario(null);
                  setMetricas(null);
                }}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </header>

            <div className="space-y-6 p-6">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card padding="sm">
                  <p className="text-sm text-slate-600">Usuários Atribuídos</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatNumber(selectedQuestionario.total_usuarios_atribuidos)}
                  </p>
                </Card>
                <Card padding="sm">
                  <p className="text-sm text-slate-600">Respostas Completas</p>
                  <p className="text-2xl font-semibold text-teal-600">
                    {formatNumber(selectedQuestionario.total_respostas_completas)}
                  </p>
                </Card>
                <Card padding="sm">
                  <p className="text-sm text-slate-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatPercent(selectedQuestionario.taxa_conclusao)}</p>
                </Card>
              </section>

              {loadingMetricas ? (
                <LoadingState label="Carregando métricas do questionário..." />
              ) : metricas ? (
                <>
                  <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                      <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Distribuição de Classificações</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={distribuicaoClassificacoes} cx="50%" cy="50%" outerRadius={96} dataKey="value">
                            {distribuicaoClassificacoes.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card>
                      <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Top 5 Dimensões Críticas</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metricas.dimensoes_criticas} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="dimensao" type="category" width={160} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="total_risco" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </section>

                  <section>
                    <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Organizações participantes</h3>
                    <div className="flex flex-wrap gap-2">
                      {metricas.organizacoes_participantes.length ? (
                        metricas.organizacoes_participantes.map((organizacao) => (
                          <Badge key={organizacao} variant="default">
                            {organizacao}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Nenhuma organização participante encontrada.</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Setores participantes</h3>
                    <div className="flex flex-wrap gap-2">
                      {metricas.setores_participantes.length ? (
                        metricas.setores_participantes.map((setor) => (
                          <Badge key={setor} variant="default">
                            {setor}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum setor participante encontrado.</p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <ErrorState message="Não foi possível carregar as métricas detalhadas." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
