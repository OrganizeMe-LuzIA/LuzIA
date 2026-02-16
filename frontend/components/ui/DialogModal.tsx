"use client";

import { PropsWithChildren, useEffect, useId } from "react";
import { X } from "lucide-react";

interface DialogModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  closeLabel?: string;
  disableClose?: boolean;
  accentClassName?: string;
  bodyClassName?: string;
}

const widthClassMap: Record<NonNullable<DialogModalProps["maxWidth"]>, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function DialogModal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = "3xl",
  closeLabel = "Fechar",
  disableClose = false,
  accentClassName = "bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500",
  bodyClassName = "",
  children,
}: DialogModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen || disableClose) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, disableClose, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4"
      onClick={(event) => {
        if (!disableClose && event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${widthClassMap[maxWidth]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descriptionId : undefined}
      >
        <div className={`h-1 w-full ${accentClassName}`} />

        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-2xl font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className={`overflow-y-auto p-6 ${bodyClassName}`}>{children}</div>
      </section>
    </div>
  );
}
