import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Pencil, X, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { TransactionDialog } from "@/components/TransactionDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Wallet", "Other"];

export default function Transactions() {
  const { data: transactions = [], isLoading, isError, error, refetch, isFetching } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const del = useDeleteTransaction();
  const currency = profile?.currency ?? "INR";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [payFilter, setPayFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [dlgOpen, setDlgOpen] = useState(false);
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  /** O(1) category lookups instead of a linear scan per row. */
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const hasFilters =
    !!search || typeFilter !== "all" || catFilter !== "all" || payFilter !== "all" || !!from || !!to || !!minAmt || !!maxAmt;

  const clearFilters = () => {
    setSearch(""); setTypeFilter("all"); setCatFilter("all"); setPayFilter("all");
    setFrom(""); setTo(""); setMinAmt(""); setMaxAmt("");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minAmt ? parseFloat(minAmt) : null;
    const max = maxAmt ? parseFloat(maxAmt) : null;
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (catFilter !== "all" && t.category_id !== catFilter) return false;
      if (payFilter !== "all" && t.payment_method !== payFilter) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      const amt = Number(t.amount);
      if (min !== null && !Number.isNaN(min) && amt < min) return false;
      if (max !== null && !Number.isNaN(max) && amt > max) return false;
      if (q) {
        const cat = categoryById.get(t.category_id ?? "")?.name ?? "";
        const hay = `${cat} ${t.note ?? ""} ${t.payment_method ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, categoryById, search, typeFilter, catFilter, payFilter, from, to, minAmt, maxAmt]);

  const confirmDelete = async () => {
    if (!pendingDelete || del.isPending) return; // guard against double submits
    try {
      await del.mutateAsync(pendingDelete.id);
      toast.success("Transaction deleted");
      setPendingDelete(null);
    } catch (e) {
      // Keep the dialog open and usable so the user can retry or cancel.
      toast.error(errorMessage(e, "Couldn't delete this transaction."));
    }
  };

  const openAdd = () => { setEdit(null); setDlgOpen(true); };
  const openEdit = (t: Transaction) => { setEdit(t); setDlgOpen(true); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-5">
        <div className="space-y-1">
          <p className="eyebrow">Activity</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Showing <span className="num font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="num">{transactions.length}</span> records
          </p>
        </div>
        <Button onClick={openAdd} className="rounded-xl h-11 gap-2 px-5 press elev-2 bg-gradient-primary text-primary-foreground hover:opacity-95">
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </header>

      {/* Filters */}
      <Card className="rounded-2xl border-border/70 elev-1 surface-tint">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="eyebrow">Search &amp; filter</span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes, categories, methods…"
              aria-label="Search transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl h-11 pl-10 pr-10 bg-card interactive"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground interactive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-xl h-10 bg-card interactive" aria-label="Filter by type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="rounded-xl h-10 bg-card interactive" aria-label="Filter by category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="rounded-xl h-10 bg-card interactive" aria-label="Filter by payment method"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2.5">
              <Input type="number" min="0" placeholder="Min" aria-label="Minimum amount" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} className="rounded-xl h-10 num bg-card interactive" />
              <Input type="number" min="0" placeholder="Max" aria-label="Maximum amount" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} className="rounded-xl h-10 num bg-card interactive" />
            </div>
            <Input type="date" aria-label="From date" max={to || undefined} value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl h-10 num bg-card interactive col-span-2" />
            <Input type="date" aria-label="To date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl h-10 num bg-card interactive col-span-2" />
          </div>

          {hasFilters && (
            <div className="flex justify-end pt-0.5">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground press">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/70 elev-1">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/70 elev-1 surface-tint">
          <CardContent className="py-16 text-center flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center elev-1">
              <Receipt className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="section-title">
                {transactions.length === 0 ? "No transactions yet" : "Nothing matches those filters"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {transactions.length === 0
                  ? "Add your first income or expense to start tracking your cash flow."
                  : "Try widening your date range or clearing a filter."}
              </p>
            </div>
            {transactions.length === 0 ? (
              <Button onClick={openAdd} className="rounded-xl h-11 gap-2 px-5 press bg-gradient-primary text-primary-foreground hover:opacity-95">
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            ) : (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl h-11 px-5 press">Clear filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((t, i) => {
            const cat = categoryById.get(t.category_id ?? "");
            const income = t.type === "income";
            const color = cat?.color ?? "hsl(var(--muted-foreground))";
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: Math.min(i, 8) * 0.02, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="group relative overflow-hidden rounded-2xl border-border/70 elev-1 card-hover">
                  {/* type accent rail */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 h-full w-[3px] ${income ? "bg-success" : "bg-destructive"} opacity-70`}
                  />
                  <CardContent className="p-4 pl-5 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                        aria-hidden="true"
                      >
                        {cat?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center ${
                          income ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                        }`}
                        aria-hidden="true"
                      >
                        {income ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{cat?.name ?? "Uncategorized"}</span>
                        <span className="hidden sm:inline-flex shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t.payment_method ?? "—"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        <span className="num">{format(parseISO(t.date), "MMM d, yyyy")}</span>
                        <span className="sm:hidden"> · {t.payment_method ?? "—"}</span>
                        {t.note ? <span> · {t.note}</span> : null}
                      </div>
                    </div>

                    <div
                      className={`num font-display font-semibold text-sm sm:text-base shrink-0 tabular-nums ${
                        income ? "text-success" : "text-destructive"
                      }`}
                    >
                      {income ? "+" : "−"}
                      {formatCurrency(Number(t.amount), currency).replace("-", "")}
                    </div>

                    <div className="flex gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 interactive">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-9 w-9 rounded-lg press" aria-label={`Edit ${cat?.name ?? "transaction"}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(t)}
                        className="h-9 w-9 rounded-lg press text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${cat?.name ?? "transaction"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            );
          })}
        </ul>
      )}

      <TransactionDialog open={dlgOpen} onOpenChange={setDlgOpen} editTx={edit} />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this transaction?"
        description={
          pendingDelete
            ? `${formatCurrency(Number(pendingDelete.amount), currency)} on ${format(parseISO(pendingDelete.date), "MMM d, yyyy")} will be removed permanently. This can't be undone.`
            : undefined
        }
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
}
