"use client";

import { useCallback, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";
import { dashboardApi } from "@/lib/api";
import { SetorDashboard, SetorDetalhado } from "@/lib/types/api";
import { average, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";

type RiscoMedio = "favoravel" | "intermediario" | "risco";

type SetorRow = SetorDashboard & { risco_medio: RiscoMedio };

function getRiscoMedio(taxaResposta: number): RiscoMedio {
  if (taxaResposta >= 80) {
    return "favoravel";
  }
  if (taxaResposta >= 60) {
    return "intermediario";
  }
  return "risco";
}

export default function SetoresPage() {
  const { token } = useAuth();
  const { filters } = useDashboardFilters();

  const [selectedSetor, setSelectedSetor] = useState<SetorDetalhado | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loader = useCallback(async () => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const setores = await dashboardApi.listSetores(token, filters.orgId || undefined);
    return setores.map((setor) => ({
      ...setor,
      risco_medio: getRiscoMedio(setor.taxa_resposta),
    }));
  }, [token, filters.orgId]);

  const { data, loading, error, refetch } = useAsyncData(loader, [loader]);
  const setores = data || [];

  const stats = useMemo(() => {
    const setoresEmRisco = setores.filter((setor) => setor.risco_medio === "risco").length;
    return {
      totalSetores: setores.length,
      mediaUsuarios: average(setores.map((setor) => setor.total_usuarios)),
      taxaMedia: average(setores.map((setor) => setor.taxa_resposta)),
      setoresEmRisco,
    };
  }, [setores]);

  const chartData = useMemo(
    () =>
      [...setores]
        .sort((a, b) => b.taxa_resposta - a.taxa_resposta)
        .slice(0, 8)
        .map((setor) => ({
          nome: setor.nome.length > 14 ? `${setor.nome.slice(0, 14)}...` : setor.nome,
          taxa_resposta: Number(setor.taxa_resposta.toFixed(2)),
        })),
    [setores],
  );

  const columns: Column<SetorRow>[] = [
    {
      key: "nome",
      label: "Setor",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <span className="font-medium text-slate-900">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "organizacao_nome",
      label: "Organização",
      sortable: true,
    },
    {
      key: "total_usuarios",
      label: "Total Usuários",
      sortable: true,
      render: (value) => formatNumber(Number(value || 0)),
    },
    {
      key: "usuarios_ativos",
      label: "Usuários Ativos",
      sortable: true,
      render: (value, row) => {
        const ativos = Number(value || 0);
        const percentual = row.total_usuarios ? (ativos / row.total_usuarios) * 100 : 0;

        return (
          <div>
            <p className="font-medium text-slate-900">{formatNumber(ativos)}</p>
            <p className="text-xs text-slate-500">{formatPercent(percentual)} do total</p>
          </div>
        );
      },
    },
    {
      key: "taxa_resposta",
      label: "Taxa de Resposta",
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
      key: "risco_medio",
      label: "Risco Médio",
      render: (value) => <Badge variant={value as RiscoMedio}>{String(value).toUpperCase()}</Badge>,
    },
  ];

  if (loading) {
    return <LoadingState label="Carregando setores..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Setores</h1>
        <p className="mt-1 text-slate-600">Análise comparativa de setores por organização</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card padding="sm">
          <p className="text-sm text-slate-600">Total de Setores</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.totalSetores)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Média de Usuários</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(Math.round(stats.mediaUsuarios))}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Taxa Média de Resposta</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(stats.taxaMedia)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Setores em Risco</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">{formatNumber(stats.setoresEmRisco)}</p>
        </Card>
      </section>

      <Card>
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Comparativo: Taxa de Resposta por Setor</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="nome" width={140} />
            <Tooltip />
            <Bar dataKey="taxa_resposta" fill="#14b8a6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={setores}
          onRowClick={async (row) => {
            if (!token) {
              return;
            }

            try {
              setLoadingDetail(true);
              const detail = await dashboardApi.getSetorDetalhado(row.id, token);
              setSelectedSetor(detail);
            } finally {
              setLoadingDetail(false);
            }
          }}
        />
      </Card>

      {loadingDetail && <LoadingState label="Carregando detalhes do setor..." />}

      <Drawer isOpen={Boolean(selectedSetor)} onClose={() => setSelectedSetor(null)} title="Detalhes do Setor">
        {selectedSetor && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-display text-xl font-semibold text-slate-900">{selectedSetor.nome}</h3>
              <p className="text-sm text-slate-600">{selectedSetor.organizacao.nome}</p>
              {selectedSetor.descricao && <p className="mt-2 text-sm text-slate-600">{selectedSetor.descricao}</p>}
            </div>

            <section>
              <h4 className="mb-2 font-display text-lg font-semibold text-slate-900">Progresso por questionário</h4>
              <div className="space-y-2">
                {Object.entries(selectedSetor.progresso_questionarios).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum progresso registrado.</p>
                ) : (
                  Object.entries(selectedSetor.progresso_questionarios).map(([questionario, progresso]) => (
                    <div key={questionario} className="rounded-lg border border-slate-200 px-3 py-2">
                      <p className="text-xs text-slate-500">Questionário {questionario}</p>
                      <p className="text-lg font-semibold text-slate-900">{formatPercent(progresso)}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-display text-lg font-semibold text-slate-900">Usuários vinculados</h4>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {selectedSetor.usuarios.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">Nenhum usuário cadastrado no setor.</p>
                ) : (
                  selectedSetor.usuarios.map((usuario) => (
                    <div key={usuario.id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="font-mono text-xs text-slate-700">AnonID: {usuario.anon_id}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <Badge variant={usuario.status === "ativo" ? "ativo" : "inativo"}>{usuario.status}</Badge>
                        {usuario.respondido && <span className="text-emerald-600">Respondido</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
