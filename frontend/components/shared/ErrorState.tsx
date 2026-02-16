interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Não foi possível carregar esta seção",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h3 className="font-display text-lg font-semibold text-rose-800">{title}</h3>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
