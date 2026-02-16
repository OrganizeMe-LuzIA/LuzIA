"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await authApi.login({ email, password });
      setSession(token.access_token, email);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível autenticar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.1fr_1fr]">
        <section className="hidden rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-2xl md:block">
          <h1 className="font-display text-4xl font-semibold text-teal-300">LuzIA</h1>
          <p className="mt-3 text-base text-slate-300">
            Dashboard executivo para monitoramento psicossocial COPSOQ II com integração nativa aos endpoints da API.
          </p>

          <div className="mt-10 space-y-4">
            <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-teal-500/20 p-2 text-teal-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold">Acesso com email e senha</h2>
              <p className="mt-1 text-sm text-slate-400">Autenticação com senha em hash seguro e token JWT com controle por perfil administrativo.</p>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900">Entrar no dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">Use email e senha já cadastrados para o usuário administrador.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@luzia.local"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Acessar painel"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <p className="mt-6 text-xs text-slate-500">
            Dica: o cadastro de credenciais é restrito a usuário admin autenticado.
          </p>
        </section>
      </div>
    </main>
  );
}
