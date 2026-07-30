import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Pencil, X } from "lucide-react";
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
  const { data: transactions = [], isLoading } = useTransactions();
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
    if (!pendingDelete) return;
    try {
      await del.mutateAsync(pendingDelete.id);
      toast.success("Transaction deleted");
      setPendingDelete(null);
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't delete this transaction."));
    }
  };

  const openAdd = () => { setEdit(null); setDlgOpen(true); };
  const openEdit = (t: Transaction) => { setEdit(t); setDlgOpen(true); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {transactions.length}</p>
        </div>
        <Button onClick={openAdd} className="rounded-xl gap-2 press"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes, categories, methods…"
              aria-label="Search transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-xl" aria-label="Filter by type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="rounded-xl" aria-label="Filter by category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="rounded-xl" aria-label="Filter by payment method"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min="0" placeholder="Min" aria-label="Minimum amount" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} className="rounded-xl" />
              <Input type="number" min="0" placeholder="Max" aria-label="Maximum amount" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} className="rounded-xl" />
            </div>
            <Input type="date" aria-label="From date" max={to || undefined} value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl md:col-span-2" />
            <Input type="date" aria-label="To date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl md:col-span-2" />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {transactions.length === 0 ? "No transactions yet — add your first one." : "No transactions match your filters."}
            </p>
            {transactions.length === 0 ? (
              <Button onClick={openAdd} className="rounded-xl gap-2 press"><Plus className="h-4 w-4" /> Add transaction</Button>
            ) : (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl press">Clear filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const cat = categoryById.get(t.category_id ?? "");
            return (
              <Card key={t.id} className="rounded-2xl shadow-soft card-hover">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}
                      aria-hidden="true"
                    >
                      <span className="font-bold">{cat?.name?.[0] ?? "?"}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{cat?.name ?? "Uncategorized"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {format(parseISO(t.date), "MMM d, yyyy")} · {t.payment_method ?? "—"}{t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className={`font-display font-semibold shrink-0 tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount), currency).replace("-", "")}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8 press" aria-label={`Edit ${cat?.name ?? "transaction"}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(t)}
                      className="h-8 w-8 press text-destructive hover:text-destructive"
                      aria-label={`Delete ${cat?.name ?? "transaction"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
