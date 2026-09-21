import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-soft to-brand text-white shadow-lift hover:from-brand hover:to-brand-deep",
  secondary: "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
  ghost: "text-slate-400 hover:text-slate-100 hover:bg-white/5",
  danger: "bg-negative/15 text-negative hover:bg-negative/25 border border-negative/20",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1",
  md: "text-sm px-4 py-2 gap-1.5",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
