/** Shared Recharts tooltip styling, kept in sync with the design tokens. */
export const chartTooltipStyle = {
  borderRadius: 14,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "var(--shadow-md)",
  fontSize: 12,
} as const;
