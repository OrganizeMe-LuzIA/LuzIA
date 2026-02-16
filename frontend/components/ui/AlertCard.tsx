import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AlertCardProps {
  titulo: string;
  descricao: string;
  severidade: "alta" | "media" | "baixa";
  ultimaAtualizacao?: string;
}

const config = {
  alta: {
    icon: XCircle,
    panel: "border-rose-200 bg-rose-50",
    iconClass: "text-rose-600",
  },
  media: {
    icon: AlertTriangle,
    panel: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-600",
  },
  baixa: {
    icon: Info,
    panel: "border-sky-200 bg-sky-50",
    iconClass: "text-sky-600",
  },
};

export function AlertCard({ titulo, descricao, severidade, ultimaAtualizacao }: AlertCardProps) {
  const current = config[severidade] || config.media;
  const Icon = current.icon;

  return (
    <div className={`rounded-xl border p-4 ${current.panel}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${current.iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="font-medium text-slate-900">{titulo}</h4>
            <Badge variant={severidade}>{severidade.toUpperCase()}</Badge>
          </div>
          <p className="text-sm text-slate-600">{descricao}</p>
          {ultimaAtualizacao && <p className="mt-1.5 text-xs text-slate-500">Atualizado em {ultimaAtualizacao}</p>}
        </div>
      </div>
    </div>
  );
}
