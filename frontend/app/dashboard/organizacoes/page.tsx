"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DialogModal } from "@/components/ui/DialogModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, organizacoesApi } from "@/lib/api";
import { Organizacao, OrganizacaoDashboard, OrganizacaoDetalhada } from "@/lib/types/api";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";
import { usePollingRefetch } from "@/lib/utils/usePollingRefetch";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function toStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "em andamento" || normalized === "em_andamento") {
    return "em andamento";
  }
  if (normalized === "não iniciado" || normalized === "nao iniciado" || normalized === "nao_iniciado") {
    return "não iniciado";
  }
  return normalized || "desconhecido";
}

export default function OrganizacoesPage() {
  const { token } = useAuth();

  const [selectedOrg, setSelectedOrg] = useState<OrganizacaoDetalhada | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editOrg, setEditOrg] = useState<Organizacao | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCnpj, setEditCnpj] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<OrganizacaoDashboard | null>(null);

  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loader = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    return dashboardApi.listOrganizacoes(token, { signal });
  }, [token]);

  const { data, loading, refreshing, error, refetch } = useAsyncData(loader, [loader]);
  usePollingRefetch(refetch, { enabled: Boolean(token), intervalMs: 30_000 });

  const organizacoes = data || [];

  const stats = useMemo(() => {
    const totalUsuarios = organizacoes.reduce((sum, org) => sum + org.total_usuarios, 0);
    const totalSetores = organizacoes.reduce((sum, org) => sum + org.total_setores, 0);
    const mediaTaxa = organizacoes.length
      ? organizacoes.reduce((sum, org) => sum + org.taxa_conclusao, 0) / organizacoes.length
      : 0;

    return {
      totalOrganizacoes: organizacoes.length,
      totalUsuarios,
      mediaSetores: organizacoes.length ? totalSetores / organizacoes.length : 0,
      mediaTaxa,
    };
  }, [organizacoes]);

  const openEdit = useCallback(
    async (orgId: string) => {
      if (!token) {
        return;
      }

      setRunningActionId(`edit-${orgId}`);
      setActionError(null);
      setActionSuccess(null);

      try {
        const org = await organizacoesApi.getById(orgId, token);
        setEditOrg(org);
        setEditNome(String(org.nome || ""));
        setEditCnpj(String(org.cnpj || ""));
        setEditCodigo(String((org.codigo as string | undefined) || ""));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao carregar organização.";
        setActionError(message);
      } finally {
        setRunningActionId(null);
      }
    },
    [token],
  );

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editOrg) {
      return;
    }

    const cnpj = digitsOnly(editCnpj);
    if (cnpj.length !== 14) {
      setActionError("CNPJ deve conter 14 dígitos.");
      return;
    }

    setSavingEdit(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const result = await organizacoesApi.update(
        editOrg.id,
        {
          nome: editNome.trim(),
          cnpj,
          codigo: editCodigo.trim() || undefined,
        },
        token,
      );
      setActionSuccess(result.message);
      setEditOrg(null);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao atualizar organização.";
      setActionError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteOrganization = useCallback(
    async (org: OrganizacaoDashboard): Promise<boolean> => {
      if (!token) {
        return false;
      }

      setRunningActionId(`delete-${org.id}`);
      setActionError(null);
      setActionSuccess(null);

      try {
        const result = await organizacoesApi.remove(org.id, token);
        setActionSuccess(result.message);
        if (selectedOrg?.id === org.id) {
          setSelectedOrg(null);
        }
        await refetch();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao excluir organização.";
        setActionError(message);
        return false;
      } finally {
        setRunningActionId(null);
      }
    },
    [token, refetch, selectedOrg],
  );

  const confirmDeleteOrganization = useCallback(async () => {
    if (!orgToDelete) {
      return;
    }

    const success = await deleteOrganization(orgToDelete);
    if (success) {
      setOrgToDelete(null);
    }
  }, [orgToDelete, deleteOrganization]);

  const columns: Column<OrganizacaoDashboard>[] = [
    {
      key: "nome",
      label: "Organização",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
            <Building2 className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{String(value)}</p>
            <p className="text-xs text-slate-500">{row.cnpj}</p>
          </div>
        </div>
      ),
    },
    { key: "total_setores", label: "Setores", sortable: true },
    { key: "total_usuarios", label: "Total Usuários", sortable: true },
    {
      key: "usuarios_ativos",
      label: "Usuários em Andamento",
      sortable: true,
      render: (value, row) => {
        const usuariosAtivos = Number(value || 0);
        const percentual = row.total_usuarios ? (usuariosAtivos / row.total_usuarios) * 100 : 0;

        return (
          <div>
            <p className="font-medium text-slate-900">{formatNumber(usuariosAtivos)}</p>
            <p className="text-xs text-slate-500">{formatPercent(percentual)} do total</p>
          </div>
        );
      },
    },
    { key: "questionarios_em_andamento", label: "Questionários", sortable: true },
    {
      key: "taxa_conclusao",
      label: "Taxa Conclusão",
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
      render: (_, row) => {
        const loadingEdit = runningActionId === `edit-${row.id}`;
        const loadingDelete = runningActionId === `delete-${row.id}`;

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={async (event) => {
                event.stopPropagation();
                if (!token) {
                  return;
                }

                try {
                  setLoadingDetail(true);
                  setDetailError(null);
                  const detail = await dashboardApi.getOrganizacaoDetalhada(row.id, token);
                  setSelectedOrg(detail);
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Falha ao carregar detalhes.";
                  setDetailError(message);
                } finally {
                  setLoadingDetail(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-teal-700 transition-colors hover:bg-teal-50"
            >
              <Eye className="h-4 w-4" />
              <span>Detalhes</span>
            </button>
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
                setOrgToDelete(row);
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
    return <LoadingState label="Carregando organizações..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Organizações</h1>
          <p className="mt-1 text-slate-600">Gerenciar e visualizar dados das organizações cadastradas</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <RefreshingIndicator active={refreshing} />
          <Link
            href="/dashboard/organizacoes/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Nova organização
          </Link>
        </div>
      </header>

      {actionSuccess && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionSuccess}</p>
      )}
      {actionError && <ErrorState title="Operação não concluída" message={actionError} />}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card padding="sm">
          <p className="text-sm text-slate-600">Total de Organizações</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.totalOrganizacoes)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Total de Usuários</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(stats.totalUsuarios)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Média de Setores</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.mediaSetores.toFixed(1)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-slate-600">Taxa Média de Conclusão</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(stats.mediaTaxa)}</p>
        </Card>
      </section>

      <Card padding="none">
        <DataTable columns={columns} data={organizacoes} />
      </Card>

      {detailError && <ErrorState title="Falha ao buscar detalhes" message={detailError} onRetry={refetch} />}

      {loadingDetail && <LoadingState label="Carregando detalhes da organização..." />}

      <DialogModal
        isOpen={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
        title={selectedOrg?.nome || "Detalhes da organização"}
        subtitle={selectedOrg ? `CNPJ: ${selectedOrg.cnpj}` : undefined}
        maxWidth="3xl"
      >
        {selectedOrg && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Status de usuários</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Object.entries(selectedOrg.usuarios_por_status || {}).length === 0 ? (
                  <p className="col-span-full text-sm text-slate-500">Sem dados de status para esta organização.</p>
                ) : (
                  Object.entries(selectedOrg.usuarios_por_status || {}).map(([status, quantidade]) => (
                    <Card key={status} padding="sm">
                      <p className="text-sm text-slate-600">{toStatusLabel(status)}</p>
                      <p className="text-2xl font-semibold text-slate-900">{formatNumber(Number(quantidade) || 0)}</p>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Setores da organização</h3>
              <div className="space-y-2">
                {(selectedOrg.setores || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum setor encontrado.</p>
                ) : (
                  (selectedOrg.setores || []).map((setor) => (
                    <div key={setor.id} className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="font-medium text-slate-900">{setor.nome}</p>
                      <p className="text-sm text-slate-600">
                        {formatNumber(setor.usuarios_ativos)} usuários em andamento de {formatNumber(setor.total_usuarios)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Questionários no escopo</h3>
              <div className="space-y-2">
                {(selectedOrg.questionarios_status || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum questionário encontrado.</p>
                ) : (
                  (selectedOrg.questionarios_status || []).map((questionario) => (
                    <div key={questionario.id} className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="font-medium text-slate-900">{questionario.nome}</p>
                      <p className="text-sm text-slate-600">
                        v{questionario.versao} {questionario.codigo ? `• ${questionario.codigo}` : ""} • conclusão{" "}
                        {formatPercent(questionario.taxa_conclusao)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </DialogModal>

      <Drawer isOpen={Boolean(editOrg)} onClose={() => (savingEdit ? undefined : setEditOrg(null))} title="Editar organização">
        <form className="space-y-4" onSubmit={saveEdit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editNome">
              Nome
            </label>
            <input
              id="editNome"
              type="text"
              value={editNome}
              onChange={(event) => setEditNome(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editCnpj">
              CNPJ
            </label>
            <input
              id="editCnpj"
              type="text"
              value={editCnpj}
              onChange={(event) => setEditCnpj(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Será enviado com apenas números ({digitsOnly(editCnpj).length}/14).</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="editCodigo">
              Código (opcional)
            </label>
            <input
              id="editCodigo"
              type="text"
              value={editCodigo}
              onChange={(event) => setEditCodigo(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOrg(null)}
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
        isOpen={Boolean(orgToDelete)}
        title="Excluir organização"
        description={
          orgToDelete
            ? `A organização "${orgToDelete.nome}" será removida permanentemente. Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir organização"
        loading={Boolean(orgToDelete && runningActionId === `delete-${orgToDelete.id}`)}
        onCancel={() => setOrgToDelete(null)}
        onConfirm={confirmDeleteOrganization}
      />
    </div>
  );
}
