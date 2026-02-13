import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Expense } from "@/types/expense";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, eachDayOfInterval } from "date-fns";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";

const COLORS = [
  "hsl(222, 47%, 30%)",
  "hsl(210, 60%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(142, 50%, 45%)",
  "hsl(38, 90%, 55%)",
  "hsl(270, 50%, 55%)",
];

interface Props {
  expenses: Expense[];
}

export function Dashboard({ expenses }: Props) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyExpenses = useMemo(
    () =>
      expenses.filter((e) =>
        isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
      ),
    [expenses, monthStart.getTime(), monthEnd.getTime()]
  );

  const totalSpent = useMemo(
    () => monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenses]
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthlyExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map, ([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const topCategory = categoryData[0]?.name ?? "—";

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: now > monthEnd ? monthEnd : now });
    const map = new Map<string, number>();
    monthlyExpenses.forEach((e) => {
      const key = e.date;
      map.set(key, (map.get(key) || 0) + e.amount);
    });
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      return { day: format(d, "MMM d"), amount: +(map.get(key) || 0).toFixed(2) };
    });
  }, [monthlyExpenses, monthStart.getTime()]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyExpenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topCategory}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {categoryData.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">No expenses yet this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyExpenses.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="hsl(222, 47%, 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
