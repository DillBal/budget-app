import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { SavingsPoint } from "../lib/api";

// Kept in its own module and loaded lazily so Recharts stays out of the
// initial bundle (the dashboard renders fine without it).
export default function SavingsSparkline({ data }: { data: SavingsPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#818cf8"
          strokeWidth={2}
          fill="url(#sparkFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
