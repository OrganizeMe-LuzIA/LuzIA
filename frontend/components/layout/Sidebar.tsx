"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/organizacoes", label: "Organizações", icon: Building2 },
  { href: "/dashboard/setores", label: "Setores", icon: Users },
  { href: "/dashboard/usuarios", label: "Usuários Ativos", icon: UserCircle },
  { href: "/dashboard/questionarios", label: "Questionários", icon: FileText },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export function Sidebar({ isMobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearSession, email } = useAuth();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={onMobileToggle} />}

      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900 p-2 text-white shadow-lg lg:hidden"
        onClick={onMobileToggle}
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <header className="flex h-16 items-center justify-between border-b border-slate-700 px-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-teal-400">LuzIA</h1>
            <p className="text-xs text-slate-400">Gestão Psicossocial</p>
          </div>
          <button
            className="rounded-lg p-2 transition-colors hover:bg-slate-800 lg:hidden"
            onClick={onMobileToggle}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobileOpen && onMobileToggle()}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <footer className="border-t border-slate-700 p-4">
          <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
            <p>Usuário autenticado</p>
            <p className="font-mono text-[11px] text-teal-300">{email || "sem email"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </footer>
      </aside>
    </>
  );
}
