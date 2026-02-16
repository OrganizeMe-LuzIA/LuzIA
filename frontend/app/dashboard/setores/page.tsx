"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";
import { dashboardApi, organizacoesApi, setoresApi } from "@/lib/api";
import { Organizacao, SetorDashboard, SetorDetalhado } from "@/lib/types/api";
import { average, formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";
import { usePollingRefetch } from "@/lib/utils/usePollingRefetch";

type RiscoMedio = "favoravel" | "intermediario" | "risco";

type SetorRow = SetorDashboard & { risco_medio: RiscoMedio };

const VerticalSingleBarChart = dynamic(
  () => import("@/components/charts/VerticalSingleBarChart").then((module) => module.VerticalSingleBarChart),
  {
    ssr: false,
    loading: () => <div className="h-[320px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

  const [editingSetorId, setEditingSetorId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editOrgId, setEditOrgId] = useState("");
  const [orgOptions, setOrgOptions] = useState<Organizacao[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [setorToDelete, setSetorToDelete] = useState<SetorRow | null>(null);

  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loader = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const setores = await dashboardApi.listSetores(token, filters.orgId || undefined, { signal });
    return setores.map((setor) => ({
      ...setor,
      risco_medio: getRiscoMedio(toFiniteNumber(setor.taxa_resposta)),
    }));
  }, [token, filters.orgId]);

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  usePollingRefetch(refetch, { enabled: Boolean(token), intervalMs: 30_000 });
  const setores = data || [];

  const stats = useMemo(() => {
    const setoresEmRisco = setores.filter((setor) => setor.risco_medio === "risco").length;
    return {
      totalSetores: setores.length,
      mediaUsuarios: average(setores.map((setor) => toFiniteNumber(setor.total_usuarios))),
      taxaMedia: average(setores.map((setor) => toFiniteNumber(setor.taxa_resposta))),
      setoresEmRisco,
    };
  }, [setores]);

  const chartData = useMemo(
    () =>
      [...setores]
        .sort((a, b) => toFiniteNumber(b.taxa_resposta) - toFiniteNumber(a.taxa_resposta))
        .slice(0, 8)
        .map((setor) => ({
          nome: setor.nome.length > 14 ? `${setor.nome.slice(0, 14)}...` : setor.nome,
          taxa_resposta: Number(toFiniteNumber(setor.taxa_resposta).toFixed(2)),
        })),
    [setores],
  );

  const hasChartData = chartData.some((item) => item.taxa_resposta > 0);

  const openEdit = useCallback(
    async (setorId: string) => {
      if (!token) {
        return;
      }

      setRunningActionId(`edit-${setorId}`);
      setActionError(null);
      setActionSuccess(null);

      try {
        const [detail, orgs] = await Promise.all([
          dashboardApi.getSetorDetalhado(setorId, token),
          organizacoesApi.list(token, 200),
        ]);

        setEditingSetorId(setorId);
        setEditNome(detail.nome);
        setEditDescricao(detail.descricao || "");
        setEditOrgId(detail.organizacao.id);
        setOrgOptions(orgs);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao carregar dados do setor.";
        setActionError(message);
      } finally {
        setRunningActionId(null);
      }
    },
    [token],
  );

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editingSetorId) {
      return;
    }

    setSavingEdit(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const result = await setoresApi.update(
        editingSetorId,
        {
          idOrganizacao: editOrgId,
          nome: editNome.trim(),
          descricao: editDescricao.trim() || undefined,
        },
        token,
      );
      setActionSuccess(result.message);
      setEditingSetorId(null);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao atualizar setor.";
      setActionError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteSector = useCallback(
    async (row: SetorRow): Promise<boolean> => {
      if (!token) {
        return false;
      }

      setRunningActionId(`delete-${row.id}`);
      setActionError(null);
      setActionSuccess(null);

      try {
        const result = await setoresApi.remove(row.id, token);
        setActionSuccess(result.message);
        if (selectedSetor?.id === row.id) {
          setSelectedSetor(null);
        }
        await refetch();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao excluir setor.";
        setActionError(message);
        return false;
      } finally {
        setRunningActionId(null);
      }
    },
    [token, refetch, selectedSetor],
  );

  const confirmDeleteSector = useCallback(async () => {
    if (!setorToDelete) {
      return;
    }

    const success = await deleteSector(setorToDelete);
    if (success) {
      setSetorToDelete(null);
    }
  }, [setorToDelete, deleteSector]);

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
    {
      key: "acoes",
      label: "Ações",
      render: (_, row) => {
        const loadingEdit = runningActionId === `edit-${row.id}`;
        const loadingDelete = runningActionId === `delete-${row.id}`;

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={async (event) => {
                event.stopPropagation();
                await openEdit(row.id);
              }}
              disabled={loadingEdit || loadingDelete}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setSetorToDelete(row);
              }}
              disabled={loadingEdit || loadingDelete}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              <span>Excluir</span>
            </button>
          </div>
        );
      },
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
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Setores</h1>
          <p className="mt-1 text-slate-600">Análise comparativa de setores por organização</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <RefreshingIndicator active={refreshing} />
          <Link
            href="/dashboard/setores/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Novo setor
          </Link>
        </div>
      </header>

      {actionSuccess && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionSuccess}</p>
      )}
      {actionError && <ErrorState title="Operação não concluída" message={actionError} />}

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
        {hasChartData ? (
          <VerticalSingleBarChart
            data={chartData}
            valueKey="taxa_resposta"
            labelKey="nome"
            height={320}
            yAxisWidth={140}
            xDomain={[0, 100]}
            fill="#14b8a6"
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
            Nenhum setor com taxa de resposta registrada para exibir.
          </div>
        )}
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

      <Drawer
        isOpen={Boolean(editingSetorId)}
        onClose={() => (savingEdit ? undefined : setEditingSetorId(null))}
        title="Editar setor"
      >
        <form className="space-y-4" onSubmit={saveEdit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editSetorNome">
              Nome
            </label>
            <input
              id="editSetorNome"
              type="text"
              value={editNome}
              onChange={(event) => setEditNome(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editSetorOrg">
              Organização
            </label>
            <select
              id="editSetorOrg"
              value={editOrgId}
              onChange={(event) => setEditOrgId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            >
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editSetorDesc">
              Descrição
            </label>
            <textarea
              id="editSetorDesc"
              value={editDescricao}
              onChange={(event) => setEditDescricao(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingSetorId(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              disabled={savingEdit}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={savingEdit}
            >
              {savingEdit ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        isOpen={Boolean(setorToDelete)}
        title="Excluir setor"
        description={
          setorToDelete
            ? `O setor "${setorToDelete.nome}" será removido permanentemente. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir setor"
        loading={Boolean(setorToDelete && runningActionId === `delete-${setorToDelete.id}`)}
        onCancel={() => setSetorToDelete(null)}
        onConfirm={confirmDeleteSector}
      />
    </div>
  );
}
