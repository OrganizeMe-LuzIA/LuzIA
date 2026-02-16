import { PropsWithChildren } from "react";
import { BadgeVariant } from "@/lib/types/api";

interface BadgeProps extends PropsWithChildren {
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  favoravel: "border-emerald-200 bg-emerald-100 text-emerald-800",
  intermediario: "border-amber-200 bg-amber-100 text-amber-800",
  risco: "border-rose-200 bg-rose-100 text-rose-700",
  alta: "border-rose-200 bg-rose-100 text-rose-700",
  media: "border-amber-200 bg-amber-100 text-amber-800",
  baixa: "border-sky-200 bg-sky-100 text-sky-700",
  ativo: "border-teal-200 bg-teal-100 text-teal-700",
  inativo: "border-slate-200 bg-slate-100 text-slate-600",
  default: "border-slate-200 bg-slate-100 text-slate-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
