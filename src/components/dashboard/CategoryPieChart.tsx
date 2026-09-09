import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import { chartTooltipStyle } from "./chartStyles";

export interface CategorySlice {
  name: string;
  color: string;
  value: number;
}

/** Lazy-loaded donut chart — shares the Recharts chunk with the cash-flow chart. */
export default function CategoryPieChart({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={66}
          outerRadius={92}
          paddingAngle={3}
          cornerRadius={6}
          stroke="hsl(var(--card))"
          strokeWidth={2}
        >
          {data.map((c, i) => (
            <Cell key={i} fill={c.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v, currency)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
