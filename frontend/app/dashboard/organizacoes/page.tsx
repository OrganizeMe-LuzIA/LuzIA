"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/lib/api";
import { OrganizacaoDashboard, OrganizacaoDetalhada } from "@/lib/types/api";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { useAsyncData } from "@/lib/utils/useAsyncData";

export default function OrganizacoesPage() {
  const { token } = useAuth();

  const [selectedOrg, setSelectedOrg] = useState<OrganizacaoDetalhada | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loader = useCallback(async () => {
    if (!token) {
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    return dashboardApi.listOrganizacoes(token);
  }, [token]);

  const { data, loading, error, refetch } = useAsyncData(loader, [loader]);

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
      label: "Usuários Ativos",
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
      render: (_, row) => (
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
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-teal-700 transition-colors hover:bg-teal-50"
        >
          <Eye className="h-4 w-4" />
          Ver detalhes
        </button>
      ),
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
      </header>

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

      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white">
            <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900">{selectedOrg.nome}</h2>
                <p className="text-sm text-slate-600">CNPJ: {selectedOrg.cnpj}</p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </header>

            <div className="space-y-6 p-6">
              <section>
                <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Status de usuários</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {Object.entries(selectedOrg.usuarios_por_status || {}).length === 0 ? (
                    <p className="col-span-full text-sm text-slate-500">Sem dados de status para esta organização.</p>
                  ) : (
                    Object.entries(selectedOrg.usuarios_por_status || {}).map(([status, quantidade]) => (
                      <Card key={status} padding="sm">
                        <p className="text-sm text-slate-600">{status}</p>
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
                          {formatNumber(setor.usuarios_ativos)} usuários ativos de {formatNumber(setor.total_usuarios)}
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
                          v{questionario.versao} {questionario.codigo ? `• ${questionario.codigo}` : ""} • conclusão {" "}
                          {formatPercent(questionario.taxa_conclusao)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
