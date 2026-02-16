import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Carregando dados..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
