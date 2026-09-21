import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl2 border border-dashed border-white/10 bg-surface/40 px-6 py-14 text-center">
      <div className="mb-4 rounded-full border border-white/10 bg-white/5 p-3">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="font-medium text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
