"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { OrganizacaoDashboard, QuestionarioStatus, SetorDashboard } from "@/lib/types/api";
import { useAuth } from "@/context/AuthContext";
import { useDashboardFilters } from "@/context/FiltersContext";

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function FilterBar() {
  const { token } = useAuth();
  const { filters, updateFilter, clearFilters } = useDashboardFilters();

  const [organizacoes, setOrganizacoes] = useState<OrganizacaoDashboard[]>([]);
  const [setores, setSetores] = useState<SetorDashboard[]>([]);
  const [questionarios, setQuestionarios] = useState<QuestionarioStatus[]>([]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();
    const loadFilters = async () => {
      try {
        const [organizacoesResult, questionariosResult] = await Promise.all([
          dashboardApi.listOrganizacoes(token, { signal: controller.signal }),
          dashboardApi.listQuestionariosStatus(token, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setOrganizacoes(organizacoesResult);
        setQuestionarios(questionariosResult);
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setOrganizacoes([]);
          setQuestionarios([]);
        }
      }
    };

    void loadFilters();

    return () => {
      controller.abort();
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const loadSetores = async () => {
      try {
        const setoresResult = await dashboardApi.listSetores(token, filters.orgId || undefined, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSetores(setoresResult);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isAbortError(err)) {
          setSetores([]);
        }
      }
    };

    void loadSetores();

    return () => {
      controller.abort();
    };
  }, [token, filters.orgId]);

  const selectedOrg = useMemo(
    () => organizacoes.find((organizacao) => organizacao.id === filters.orgId),
    [organizacoes, filters.orgId],
  );

  return (
    <section className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-semibold">Filtros:</span>
        </div>

        <select
          value={filters.orgId}
          onChange={(event) => updateFilter("orgId", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todas Organizações</option>
          {organizacoes.map((organizacao) => (
            <option key={organizacao.id} value={organizacao.id}>
              {organizacao.nome}
            </option>
          ))}
        </select>

        <select
          value={filters.setorId}
          onChange={(event) => updateFilter("setorId", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos Setores</option>
          {setores.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
            </option>
          ))}
        </select>

        <select
          value={filters.questionarioId}
          onChange={(event) => updateFilter("questionarioId", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos Questionários</option>
          {questionarios.map((questionario) => (
            <option key={questionario.id} value={questionario.id}>
              {questionario.nome}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
          <Calendar className="h-4 w-4 text-slate-500" />
          <select
            value={filters.period}
            onChange={(event) => updateFilter("period", event.target.value)}
            className="border-none bg-transparent text-sm outline-none"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo período</option>
          </select>
        </label>

        <div className="ml-auto flex items-center gap-4">
          {selectedOrg && <p className="text-xs text-slate-500">Organização ativa: {selectedOrg.nome}</p>}
          <button
            onClick={clearFilters}
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
