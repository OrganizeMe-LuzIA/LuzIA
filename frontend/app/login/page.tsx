"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRoundPlus } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+5511999999999");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFeedback(null);

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

  const handleRegisterCredentials = async () => {
    if (!phone.startsWith("+")) {
      setError("Informe o telefone no formato E.164, por exemplo +5511999999999.");
      return;
    }

    setRegistering(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await authApi.registerCredentials({ email, password, phone });
      setFeedback(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar credenciais.";
      setError(message);
    } finally {
      setRegistering(false);
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

            <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-teal-500/20 p-2 text-teal-300">
                <UserRoundPlus className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold">Cadastro de credenciais</h2>
              <p className="mt-1 text-sm text-slate-400">Se for primeiro acesso, vincule email e senha ao usuário existente usando o telefone.</p>
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

          <div className="mt-8 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Primeiro acesso</p>
            <p className="text-xs text-slate-600">Vincule email/senha ao usuário já cadastrado no WhatsApp.</p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="phone">
                Telefone do usuário
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="button"
              onClick={handleRegisterCredentials}
              disabled={registering}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registering ? "Salvando..." : "Salvar credenciais no banco"}
            </button>
          </div>

          {feedback && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{feedback}</p>}
          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <p className="mt-6 text-xs text-slate-500">
            Dica: os endpoints administrativos exigem usuário ativo com `metadata.is_admin = true`.
          </p>
        </section>
      </div>
    </main>
  );
}
