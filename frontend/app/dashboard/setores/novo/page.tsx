"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { organizacoesApi, setoresApi } from "@/lib/api";
import { Organizacao } from "@/lib/types/api";

export default function NovoSetorPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [idOrganizacao, setIdOrganizacao] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrgs = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingOrgs(true);
    setError(null);
    try {
      const items = await organizacoesApi.list(token, 200);
      setOrganizacoes(items);
      if (items.length > 0) {
        setIdOrganizacao(items[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar organizações.";
      setError(message);
    } finally {
      setLoadingOrgs(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  const selectedOrgName = useMemo(
    () => organizacoes.find((org) => org.id === idOrganizacao)?.nome || "",
    [organizacoes, idOrganizacao],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!idOrganizacao) {
      setError("Selecione uma organização.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setoresApi.create(
        {
          idOrganizacao,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
        },
        token,
      );
      setSuccess("Setor criado com sucesso.");
      setTimeout(() => router.push("/dashboard/setores"), 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar setor.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return <ErrorState message="Sessão inválida. Faça login novamente." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Novo Setor</h1>
          <p className="mt-1 text-slate-600">Cadastrar setor e vincular à organização</p>
        </div>
        <Link
          href="/dashboard/setores"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-2 text-slate-700">
            <Users className="h-5 w-5 text-teal-600" />
            <p className="text-sm font-semibold">Dados do setor</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="org">
              Organização
            </label>
            <select
              id="org"
              value={idOrganizacao}
              onChange={(event) => setIdOrganizacao(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            >
              {organizacoes.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.nome}
                </option>
              ))}
            </select>
            {selectedOrgName && <p className="mt-1 text-xs text-slate-500">Setor será criado em: {selectedOrgName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="nome">
              Nome do setor
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Ex.: Recursos Humanos"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="descricao">
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Resumo das responsabilidades do setor"
            />
          </div>

          <button
            type="submit"
            disabled={saving || loadingOrgs || organizacoes.length === 0}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Cadastrar setor"}
          </button>
        </form>
      </Card>

      {loadingOrgs && <LoadingState label="Carregando organizações..." />}
      {error && <ErrorState title="Não foi possível salvar" message={error} onRetry={loadOrgs} />}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}
      {!loadingOrgs && organizacoes.length === 0 && (
        <ErrorState
          title="Nenhuma organização encontrada"
          message="Cadastre uma organização antes de criar setores."
          onRetry={loadOrgs}
        />
      )}
    </div>
  );
}
