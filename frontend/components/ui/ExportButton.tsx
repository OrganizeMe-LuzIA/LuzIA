"use client";

import { useState } from "react";
import { Download, FileText, Image, Table } from "lucide-react";

type ExportFormat = "pdf" | "excel" | "csv" | "image";

interface ExportButtonProps {
  onExport?: (format: ExportFormat) => void;
  formats?: ExportFormat[];
  label?: string;
}

const formatConfig: Record<ExportFormat, { icon: typeof FileText; label: string }> = {
  pdf: { icon: FileText, label: "PDF" },
  excel: { icon: Table, label: "Excel" },
  csv: { icon: Table, label: "CSV" },
  image: { icon: Image, label: "Imagem" },
};

export function ExportButton({ onExport, formats = ["pdf", "excel", "csv"], label = "Exportar" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <>
          <button aria-label="Fechar" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {formats.map((format) => {
              const Icon = formatConfig[format].icon;
              return (
                <button
                  key={format}
                  onClick={() => {
                    onExport?.(format);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>Exportar como {formatConfig[format].label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
