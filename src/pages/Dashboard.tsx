import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/format";
import { TransactionDialog } from "@/components/TransactionDialog";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
  subMonths,
  startOfDay,
} from "date-fns";

export default function Dashboard() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgType, setDlgType] = useState<"income" | "expense">("expense");
  const navigate = useNavigate();
  const currency = profile?.currency ?? "INR";

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const stats = useMemo(() => {
    const inMonth = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );
    const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return {
      balance: totalIncome - totalExpense,
      income,
      expense,
      savings: income - expense,
      monthCount: inMonth.length,
    };
  }, [transactions, monthStart.getTime(), monthEnd.getTime()]);

  const cashFlow = useMemo(() => {
    const buckets: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const s = startOfMonth(d);
      const e = endOfMonth(d);
      const key = format(d, "MMM");
      const inRange = transactions.filter((t) => isWithinInterval(parseISO(t.date), { start: s, end: e }));
      buckets.push({
        month: key,
        income: +inRange.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0).toFixed(2),
        expense: +inRange.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0).toFixed(2),
      });
    }
    return buckets;
  }, [transactions]);

  const byCategory = useMemo(() => {
    const inMonth = transactions.filter(
      (t) => t.type === "expense" && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );
    const map = new Map<string, { value: number; color: string; name: string }>();
    inMonth.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name ?? "Uncategorized";
      const color = cat?.color ?? "#64748b";
      const prev = map.get(name);
      map.set(name, { name, color, value: (prev?.value ?? 0) + Number(t.amount) });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transactions, categories, monthStart.getTime(), monthEnd.getTime()]);

  const recent = transactions.slice(0, 5);

  const openAdd = (type: "income" | "expense") => {
    setDlgType(type);
    setDlgOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Hi{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""} 👋
          </h1>
        </div>
      </div>

      {/* Balance Hero */}
      <Card className="rounded-3xl overflow-hidden border-none shadow-elegant bg-gradient-hero text-primary-foreground">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Wallet className="h-4 w-4" /> Current balance
          </div>
          <div className="mt-2 font-display text-4xl md:text-5xl font-bold tracking-tight">
            {formatCurrency(stats.balance, currency)}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => openAdd("expense")} variant="secondary" className="rounded-xl gap-2 bg-white/95 text-foreground hover:bg-white">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
            <Button onClick={() => openAdd("income")} variant="secondary" className="rounded-xl gap-2 bg-white/15 text-primary-foreground border border-white/20 backdrop-blur hover:bg-white/25">
              <Plus className="h-4 w-4" /> Add Income
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<ArrowDownRight className="h-4 w-4" />} label="Income this month" value={formatCurrency(stats.income, currency)} tone="success" />
        <StatCard icon={<ArrowUpRight className="h-4 w-4" />} label="Expenses this month" value={formatCurrency(stats.expense, currency)} tone="destructive" />
        <StatCard icon={<PiggyBank className="h-4 w-4" />} label="Savings this month" value={formatCurrency(stats.savings, currency)} tone={stats.savings >= 0 ? "success" : "destructive"} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-3xl lg:col-span-3 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Monthly cash flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cashFlow} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No expenses this month yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(v: number) => formatCurrency(v, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Recent transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>View all</Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted-foreground mb-4">No transactions yet. Add your first one!</p>
              <Button onClick={() => openAdd("expense")} className="rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-xl p-2 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}>
                        <span className="text-lg font-bold">{cat?.name?.[0] ?? "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{cat?.name ?? "Uncategorized"}</div>
                        <div className="text-xs text-muted-foreground truncate">{format(parseISO(t.date), "MMM d")} · {t.payment_method ?? "—"}{t.note ? ` · ${t.note}` : ""}</div>
                      </div>
                    </div>
                    <div className={`font-display font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount), currency).replace("-", "")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={dlgOpen} onOpenChange={setDlgOpen} defaultType={dlgType} />
    </motion.div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "success" | "destructive" }) {
  const toneClass = tone === "success" ? "text-success bg-success/10" : "text-destructive bg-destructive/10";
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${toneClass}`}>{icon}</span>
        </div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
