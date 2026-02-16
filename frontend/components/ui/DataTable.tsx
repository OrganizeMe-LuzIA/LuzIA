"use client";

import { ReactNode, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface Column<T extends object> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function getRowValue<T extends object>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });
}

export function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }

    return [...data].sort((left, right) => {
      const leftValue = getRowValue(left, sortKey);
      const rightValue = getRowValue(right, sortKey);
      const result = compareValues(leftValue, rightValue);
      return sortDirection === "asc" ? result : -result;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-slate-100">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3">
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return <div className="py-12 text-center text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => {
              const key = String(column.key);
              const isSorted = sortKey === key;
              return (
                <th
                  key={key}
                  onClick={() => column.sortable && handleSort(key)}
                  className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 ${
                    column.sortable ? "cursor-pointer select-none hover:bg-slate-50" : ""
                  } ${column.className || ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.label}</span>
                    {column.sortable && isSorted && (
                      <span className="text-slate-500">
                        {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={`row-${index}`}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-100 ${onRowClick ? "cursor-pointer transition-colors hover:bg-teal-50/50" : ""}`}
            >
              {columns.map((column) => {
                const key = String(column.key);
                const value = getRowValue(row, key);
                return (
                  <td key={key} className={`px-4 py-3 text-sm text-slate-700 ${column.className || ""}`}>
                    {column.render ? column.render(value, row) : String(value ?? "-")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
