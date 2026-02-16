"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { DashboardFilters } from "@/lib/types/api";

interface FiltersContextValue {
  filters: DashboardFilters;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  clearFilters: () => void;
}

const initialFilters: DashboardFilters = {
  orgId: "",
  setorId: "",
  questionarioId: "",
  period: "30",
};

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

export function FiltersProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      updateFilter: (key, value) => {
        setFilters((current) => {
          const next = { ...current, [key]: value };
          if (key === "orgId") {
            next.setorId = "";
          }
          return next;
        });
      },
      clearFilters: () => {
        setFilters(initialFilters);
      },
    }),
    [filters],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useDashboardFilters(): FiltersContextValue {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useDashboardFilters precisa ser utilizado dentro de FiltersProvider.");
  }
  return context;
}
