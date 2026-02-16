import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FiltersProvider } from "@/context/FiltersContext";

const fontVars: CSSProperties = {
  ["--font-manrope" as string]: "Manrope, 'Segoe UI', Roboto, Arial, sans-serif",
  ["--font-space-grotesk" as string]: "'Space Grotesk', 'Segoe UI', Roboto, Arial, sans-serif",
};

export const metadata: Metadata = {
  title: "LuzIA Dashboard",
  description: "Dashboard COPSOQ II com integração aos endpoints do backend LuzIA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body style={fontVars} className="font-sans text-slate-900 antialiased">
        <AuthProvider>
          <FiltersProvider>{children}</FiltersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
