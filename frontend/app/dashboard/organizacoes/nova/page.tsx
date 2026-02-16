"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { organizacoesApi } from "@/lib/api";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function NovaOrganizacaoPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cnpjLimpo = useMemo(() => onlyDigits(cnpj), [cnpj]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (cnpjLimpo.length !== 14) {
      setError("CNPJ deve conter 14 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await organizacoesApi.create(
        {
          nome: nome.trim(),
          cnpj: cnpjLimpo,
          codigo: codigo.trim() || undefined,
        },
        token,
      );
      setSuccess("Organização criada com sucesso.");
      setTimeout(() => router.push("/dashboard/organizacoes"), 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar organização.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <ErrorState message="Sessão inválida. Faça login novamente." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Nova Organização</h1>
          <p className="mt-1 text-slate-600">Cadastrar empresa e persistir no MongoDB</p>
        </div>
        <Link
          href="/dashboard/organizacoes"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="h-5 w-5 text-teal-600" />
            <p className="text-sm font-semibold">Dados da empresa</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="nome">
              Nome da organização
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Ex.: Empresa Exemplo LTDA"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(event) => setCnpj(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="00.000.000/0000-00"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Será enviado com apenas números ({cnpjLimpo.length}/14).</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="codigo">
              Código interno (opcional)
            </label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Ex.: EMP001"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Cadastrar organização"}
            </button>
          </div>
        </form>
      </Card>

      {loading && <LoadingState label="Criando organização..." />}
      {error && <ErrorState title="Não foi possível salvar" message={error} />}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}
    </div>
  );
}
