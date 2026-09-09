import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/format";
import { chartTooltipStyle } from "./chartStyles";

export interface CashFlowPoint {
  month: string;
  income: number;
  expense: number;
}

/**
 * Recharts is heavy (~400 kB raw), so this chart lives in its own chunk and is
 * lazy-loaded by the Dashboard. Presentation is identical to the inline version.
 */
export default function CashFlowChart({
  data,
  currency,
}: {
  data: CashFlowPoint[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="cf-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cf-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.22} />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={8} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={58} tickFormatter={(v: number) => formatCompact(v, currency)} />
        <Tooltip
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          contentStyle={chartTooltipStyle}
          formatter={(v: number) => formatCurrency(v, currency)}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={8} />
        <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#cf-income)" activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2.5} fill="url(#cf-expense)" activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
