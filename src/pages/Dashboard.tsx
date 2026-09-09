import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, Wallet, PiggyBank, ChevronRight, PieChart as PieChartIcon } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency, formatCompact } from "@/lib/format";
import { TransactionDialog } from "@/components/TransactionDialog";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
  subMonths,
} from "date-fns";

// Recharts is the single largest dependency; keeping it out of the initial
// bundle lets the dashboard shell paint first. Behaviour is unchanged.
const CashFlowChart = lazy(() => import("@/components/dashboard/CashFlowChart"));
const CategoryPieChart = lazy(() => import("@/components/dashboard/CategoryPieChart"));


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

  /** O(1) category lookups instead of a linear scan per row. */
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const byCategory = useMemo(() => {
    const inMonth = transactions.filter(
      (t) => t.type === "expense" && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );
    const map = new Map<string, { value: number; color: string; name: string }>();
    inMonth.forEach((t) => {
      const cat = categoryById.get(t.category_id ?? "");
      const name = cat?.name ?? "Uncategorized";
      const color = cat?.color ?? "#64748b";
      const prev = map.get(name);
      map.set(name, { name, color, value: (prev?.value ?? 0) + Number(t.amount) });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transactions, categoryById, monthStart.getTime(), monthEnd.getTime()]);

  const categoryTotal = useMemo(() => byCategory.reduce((s, c) => s + c.value, 0), [byCategory]);

  const recent = transactions.slice(0, 5);

  const openAdd = (type: "income" | "expense") => {
    setDlgType(type);
    setDlgOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-7 md:space-y-9">
        <Skeleton className="h-14 w-56 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          <Skeleton className="h-56 rounded-3xl sm:col-span-2" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }


  const tooltipStyle = {
    borderRadius: 14,
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    boxShadow: "var(--shadow-md)",
    fontSize: 12,
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7 md:space-y-9"
    >
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <p className="eyebrow">{format(now, "EEEE, MMM d")}</p>
          <h1 className="font-display text-[26px] leading-tight md:text-[32px] font-bold">
            Hi{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""} 👋
          </h1>
        </div>
        <p className="rounded-full bg-muted/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {stats.monthCount} transaction{stats.monthCount === 1 ? "" : "s"} this month
        </p>
      </header>

      {/* Balance + stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-charcoal text-hero elev-3 sm:col-span-2">
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hero-soft" />
          <CardContent className="relative flex h-full flex-col justify-between gap-7 p-7 md:p-8">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                <Wallet className="h-3.5 w-3.5" /> Total balance
              </div>
              <div className="mt-3 font-display text-[34px] leading-none md:text-[42px] font-bold num">
                {formatCurrency(stats.balance, currency)}
              </div>
              <p className="mt-3 text-xs opacity-60">
                Net of all income and expenses to date
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => openAdd("expense")}
                className="flex-1 h-12 rounded-2xl gap-2 press bg-destructive font-semibold text-destructive-foreground elev-2 hover:bg-destructive/90"
              >
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
              <Button
                onClick={() => openAdd("income")}
                className="flex-1 h-12 rounded-2xl gap-2 press bg-primary font-semibold text-primary-foreground elev-2 hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add Income
              </Button>
            </div>
          </CardContent>
        </Card>

        <StatCard icon={<ArrowUpRight className="h-4 w-4" />} label="Income this month" value={formatCurrency(stats.income, currency)} tone="success" />
        <StatCard icon={<ArrowDownRight className="h-4 w-4" />} label="Expenses this month" value={formatCurrency(stats.expense, currency)} tone="destructive" />
        <StatCard icon={<PiggyBank className="h-4 w-4" />} label="Savings this month" value={formatCurrency(stats.savings, currency)} tone={stats.savings >= 0 ? "info" : "destructive"} />
      </section>


      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="rounded-3xl border-border/60 elev-2 card-hover lg:col-span-2">
          <CardHeader className="gap-1 pb-1">
            <CardTitle className="section-title flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </span>
              Monthly cash flow
            </CardTitle>
            <p className="pl-9 text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent className="pt-3">

            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
              <CashFlowChart data={cashFlow} currency={currency} />
            </Suspense>

          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-3xl border-border/60 elev-2 card-hover">
          <CardHeader className="gap-1 pb-1">
            <CardTitle className="section-title flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PieChartIcon className="h-4 w-4" />
              </span>
              Spending by category
            </CardTitle>
            <p className="pl-9 text-xs text-muted-foreground">{format(now, "MMMM yyyy")}</p>

          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between pt-3">
            {byCategory.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No expenses this month yet.</p>
            ) : (
              <>
                <div className="relative">
                  <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-2xl" />}>
                    <CategoryPieChart data={byCategory} currency={currency} />
                  </Suspense>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="eyebrow text-[10px]">Total</span>
                    <span className="mt-0.5 font-display text-xl font-bold num">{formatCompact(categoryTotal, currency)}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {byCategory.slice(0, 4).map((c) => (
                    <li key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                          <span className="truncate text-muted-foreground">{c.name}</span>
                        </span>
                        <span className="num font-semibold">{formatCurrency(c.value, currency)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${categoryTotal ? Math.max(4, (c.value / categoryTotal) * 100) : 0}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent */}
      <Card className="rounded-3xl border-border/60 elev-2 card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="section-title">Recent transactions</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 rounded-xl text-primary hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/transactions")}>
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-3">

          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">No transactions yet. Add your first one!</p>
              <Button onClick={() => openAdd("expense")} className="rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((t) => {
                const cat = categoryById.get(t.category_id ?? "");
                return (
                  <div key={t.id} className="-mx-2 flex items-center justify-between gap-3 rounded-2xl px-2 py-3 interactive hover:bg-muted/60">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-border/50"
                        style={{ background: (cat?.color ?? "#64748b") + "1f", color: cat?.color ?? "#64748b" }}
                      >
                        <span className="font-display text-base font-bold">{cat?.name?.[0] ?? "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{cat?.name ?? "Uncategorized"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {format(parseISO(t.date), "MMM d")} · {t.payment_method ?? "—"}{t.note ? ` · ${t.note}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className={`num font-display text-sm font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "−"}{formatCurrency(Number(t.amount), currency).replace("-", "")}
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

type Tone = "success" | "destructive" | "info" | "warning";

/** Accent map: income = emerald, expense = coral, savings = blue-teal, budget = amber. */
const TONES: Record<Tone, { badge: string; value: string; bar: string }> = {
  success: { badge: "text-success bg-success/10 ring-success/20", value: "text-success", bar: "bg-success" },
  destructive: { badge: "text-destructive bg-destructive/10 ring-destructive/20", value: "text-destructive", bar: "bg-destructive" },
  info: { badge: "text-info bg-info/10 ring-info/20", value: "text-info", bar: "bg-info" },
  warning: { badge: "text-warning bg-warning/10 ring-warning/20", value: "text-warning", bar: "bg-warning" },
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-border/60 elev-2 card-hover surface-tint">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${t.bar} opacity-70`} />
      <CardContent className="flex h-full flex-col justify-center gap-6 p-6">
        <div className="flex items-start justify-between">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${t.badge}`}>{icon}</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-[0.01em] text-muted-foreground">{label}</p>
          <p className={`num font-display text-[26px] leading-none font-bold ${t.value}`}>{value}</p>
        </div>
      </CardContent>

    </Card>
  );
}
