import { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClassMap: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <article
      className={`rounded-xl border border-slate-200/80 bg-white/95 shadow-panel backdrop-blur ${paddingClassMap[padding]} ${className}`}
    >
      {children}
    </article>
  );
}
