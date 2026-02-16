"use client";

import { useCallback, useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";
import { dashboardApi } from "@/lib/api";
import { ProgressoUsuario, UsuarioAtivo } from "@/lib/types/api";
import { average, formatDateTime, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const colorClass = clamped >= 80 ? "bg-emerald-500" : clamped >= 50 ? "bg-amber-500" : "bg-teal-500";

  return (
    <div className="w-full max-w-[150px]">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{formatPercent(clamped)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { token } = useAuth();
  const { filters } = useDashboardFilters();

  const [selectedUser, setSelectedUser] = useState<UsuarioAtivo | null>(null);
  const [progresso, setProgresso] = useState<ProgressoUsuario | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loader = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    return dashboardApi.listUsuariosAtivos(token, {
      orgId: filters.orgId || undefined,
      setorId: filters.setorId || undefined,
    }, { signal });
  }, [token, filters.orgId, filters.setorId]);

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  const usuarios = data || [];

  const stats = useMemo(() => {
    const progressoMedio = average(usuarios.map((usuario) => usuario.progresso_atual));
    const concluidos = usuarios.filter((usuario) => usuario.progresso_atual >= 100).length;
    const tempoEstimado = Math.max(5, Math.round((100 - progressoMedio) / 4));

    return {
      totalUsuarios: usuarios.length,
      progressoMedio,
      concluidos,
      tempoEstimado,
    };
  }, [usuarios]);

  const columns: Column<UsuarioAtivo>[] = [
    {
      key: "telefone_mascarado",
      label: "Telefone",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
            <Phone className="h-4 w-4 text-teal-600" />
          </div>
          <span className="font-mono text-sm text-slate-700">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "organizacao",
      label: "Organização",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-slate-900">{String(value)}</p>
          <p className="text-xs text-slate-500">{row.setor || "Sem setor"}</p>
        </div>
      ),
    },
    {
      key: "questionario_em_andamento",
      label: "Questionário",
      render: (value) => <span className="text-sm text-slate-600">{String(value || "-")}</span>,
    },
    {
      key: "progresso_atual",
      label: "Progresso",
      sortable: true,
      render: (value) => <ProgressBar value={Number(value || 0)} />,
    },
    {
      key: "ultima_atividade",
      label: "Última Atividade",
      sortable: true,
      render: (value) => <span className="text-sm text-slate-600">{formatDateTime(String(value))}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <Badge variant={String(value) === "ativo" ? "ativo" : "inativo"}>{String(value)}</Badge>,
    },
  ];

  if (loading) {
    return <LoadingState label="Carregando usuários ativos..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Usuários Ativos</h1>
          <p className="mt-1 text-slate-600">Monitoramento de usuários com questionários em andamento</p>
        </div>
        <RefreshingIndicator active={refreshing} />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card padding="sm">
          <p className="text-sm text-slate-600">Total Usuários Ativos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.totalUsuarios)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Progresso Médio</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(stats.progressoMedio)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Conclusões no Escopo</p>
          <p className="mt-1 text-2xl font-semibold text-teal-600">{formatNumber(stats.concluidos)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Tempo Médio Restante</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.tempoEstimado} min</p>
        </Card>
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm text-sky-900">
          <strong>Privacidade garantida:</strong> os dados exibidos são anonimizados e mascarados conforme LGPD.
        </p>
      </section>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={usuarios}
          onRowClick={async (row) => {
            if (!token) {
              return;
            }

            setSelectedUser(row);
            setLoadingDetail(true);

            try {
              const detail = await dashboardApi.getUsuarioProgresso(row.id, token);
              setProgresso(detail);
            } finally {
              setLoadingDetail(false);
            }
          }}
        />
      </Card>

      <Drawer isOpen={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} title="Progresso do Usuário">
        {selectedUser && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-600" />
                <span className="font-mono text-sm font-semibold">{selectedUser.telefone_mascarado}</span>
              </div>
              <p className="text-sm text-slate-600">
                {selectedUser.organizacao} • {selectedUser.setor || "Sem setor"}
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Questionário em andamento</h3>
              <p className="text-sm text-slate-600">{selectedUser.questionario_em_andamento || "Sem questionário em andamento"}</p>
            </div>

            {loadingDetail ? (
              <LoadingState label="Carregando progresso detalhado..." />
            ) : progresso ? (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-slate-900">Progresso geral</h3>
                    <span className="text-2xl font-bold text-teal-600">{formatPercent(progresso.percentual_conclusao)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-teal-600"
                      style={{ width: `${Math.max(0, Math.min(100, progresso.percentual_conclusao))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card padding="sm">
                    <p className="text-sm text-slate-600">Perguntas Respondidas</p>
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(progresso.perguntas_respondidas)}</p>
                  </Card>
                  <Card padding="sm">
                    <p className="text-sm text-slate-600">Total de Perguntas</p>
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(progresso.total_perguntas)}</p>
                  </Card>
                  <Card padding="sm">
                    <p className="text-sm text-slate-600">Tempo Estimado</p>
                    <p className="text-xl font-semibold text-slate-900">{progresso.tempo_estimado_restante || "-"}</p>
                  </Card>
                  <Card padding="sm">
                    <p className="text-sm text-slate-600">Última Resposta</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDateTime(progresso.ultima_resposta)}</p>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Nenhum progresso detalhado encontrado.</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
