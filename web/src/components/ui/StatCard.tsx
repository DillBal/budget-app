import { ReactNode } from "react";
import { Card } from "./Card";

type Tone = "default" | "brand" | "positive" | "caution" | "negative";

const tones: Record<Tone, string> = {
  default: "text-slate-100",
  brand: "text-brand-soft",
  positive: "text-positive",
  caution: "text-caution",
  negative: "text-negative",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  tone?: Tone;
  sub?: ReactNode;
}

export function StatCard({ label, value, tone = "default", sub }: StatCardProps) {
  return (
    <Card className="animate-fade-up">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`nums mt-1 text-2xl font-semibold tracking-tight ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}
