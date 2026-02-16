import { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  loading?: boolean;
}

export function KPICard({ title, value, icon, trend, loading = false }: KPICardProps) {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-2/3 rounded bg-slate-200" />
          <div className="h-8 w-1/2 rounded bg-slate-200" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              {trend.direction === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-600" />
              )}
              <span className={trend.direction === "up" ? "text-emerald-600" : "text-rose-600"}>{trend.value}%</span>
              <span className="text-slate-500">vs. período anterior</span>
            </div>
          )}
        </div>
        {icon && <div className="rounded-xl bg-teal-50 p-3 text-teal-600">{icon}</div>}
      </div>
    </Card>
  );
}
