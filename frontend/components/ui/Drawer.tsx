"use client";

import { PropsWithChildren } from "react";
import { X } from "lucide-react";

interface DrawerProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/45" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </aside>
    </>
  );
}
