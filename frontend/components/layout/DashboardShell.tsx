"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { FilterBar } from "@/components/layout/FilterBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuth } from "@/context/AuthContext";

export function DashboardShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <LoadingState label="Validando sessão..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isMobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen((current) => !current)} />

      <div className="min-h-screen lg:ml-64">
        <FilterBar />

        <main className="p-6 lg:p-8">{children}</main>

        <footer className="mt-6 border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <p>© 2026 LuzIA - Sistema de Gestão Psicossocial COPSOQ II</p>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">Next.js + TypeScript</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">API v1</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
