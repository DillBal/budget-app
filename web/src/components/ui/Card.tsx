import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, className = "", padded = true, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl2 border border-white/5 bg-surface/80 shadow-card backdrop-blur-sm ${
        padded ? "p-4" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide text-slate-400">{children}</h2>
      {action}
    </div>
  );
}
