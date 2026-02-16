"use client";

interface RefreshingIndicatorProps {
  active: boolean;
  label?: string;
  className?: string;
}

export function RefreshingIndicator({
  active,
  label = "Atualizando dados...",
  className = "",
}: RefreshingIndicatorProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-600" />
      </span>
      {label}
    </div>
  );
}
