import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/format";
import { TransactionDialog } from "@/components/TransactionDialog";
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

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (catFilter !== "all" && t.category_id !== catFilter) return false;
      if (payFilter !== "all" && t.payment_method !== payFilter) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      const amt = Number(t.amount);
      if (minAmt && amt < parseFloat(minAmt)) return false;
      if (maxAmt && amt > parseFloat(maxAmt)) return false;
      if (search) {
        const cat = categories.find((c) => c.id === t.category_id)?.name ?? "";
        const hay = `${cat} ${t.note ?? ""} ${t.payment_method ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [transactions, categories, search, typeFilter, catFilter, payFilter, from, to, minAmt, maxAmt]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
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
        <Button onClick={openAdd} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes, categories, methods…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl pl-9" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Min ₹" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} className="rounded-xl" />
              <Input type="number" placeholder="Max ₹" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} className="rounded-xl" />
            </div>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl md:col-span-2" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl md:col-span-2" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No transactions match your filters.</p>
            <Button onClick={openAdd} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> Add transaction</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            return (
              <Card key={t.id} className="rounded-2xl shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}>
                      <span className="font-bold">{cat?.name?.[0] ?? "?"}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{cat?.name ?? "Uncategorized"}</div>
                      <div className="text-xs text-muted-foreground truncate">{format(parseISO(t.date), "MMM d, yyyy")} · {t.payment_method ?? "—"}{t.note ? ` · ${t.note}` : ""}</div>
                    </div>
                  </div>
                  <div className={`font-display font-semibold shrink-0 ${t.type === "income" ? "text-success" : ""}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount), currency).replace("-", "")}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TransactionDialog open={dlgOpen} onOpenChange={setDlgOpen} editTx={edit} />
    </motion.div>
  );
}
