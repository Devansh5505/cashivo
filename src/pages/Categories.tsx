import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Check, Tags, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useCategories, useAddCategory, useDeleteCategory, type Category } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { errorMessage } from "@/lib/errors";
import { toast } from "sonner";

const COLORS = ["#10b981", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#64748b"];

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const add = useAddCategory();
  const del = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [filter, setFilter] = useState<"expense" | "income">("expense");
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const list = useMemo(() => categories.filter((c) => c.type === filter), [categories, filter]);

  const counts = useMemo(
    () => ({
      expense: categories.filter((c) => c.type === "expense").length,
      income: categories.filter((c) => c.type === "income").length,
    }),
    [categories],
  );

  /** How many transactions reference each category — shown before deleting. */
  const usageById = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.category_id) map.set(t.category_id, (map.get(t.category_id) ?? 0) + 1);
    }
    return map;
  }, [transactions]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return toast.error("Please enter a category name.");
    if (clean.length > 40) return toast.error("Category name must be 40 characters or fewer.");
    const duplicate = categories.some((c) => c.type === type && c.name.toLowerCase() === clean.toLowerCase());
    if (duplicate) return toast.error("A category with that name already exists.");
    try {
      await add.mutateAsync({ name: clean, icon: "Circle", color, type });
      toast.success("Category added");
      setOpen(false);
      setName("");
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't add this category."));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await del.mutateAsync(pendingDelete.id);
      toast.success("Category deleted");
      setPendingDelete(null);
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't delete this category."));
    }
  };

  const pendingUsage = pendingDelete ? usageById.get(pendingDelete.id) ?? 0 : 0;

  const tabs: { value: "expense" | "income"; label: string; count: number; Icon: typeof ArrowUpRight }[] = [
    { value: "expense", label: "Expense", count: counts.expense, Icon: ArrowDownLeft },
    { value: "income", label: "Income", count: counts.income, Icon: ArrowUpRight },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-5">
        <div className="space-y-1">
          <p className="eyebrow">Organisation</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">Categories</h1>
          <p className="text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{list.length}</span>{" "}
            {filter} categor{list.length === 1 ? "y" : "ies"} in use
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 gap-2 px-5 press elev-2 bg-gradient-primary text-primary-foreground hover:opacity-95">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl elev-3 sm:max-w-md">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-lg">New category</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label className="eyebrow">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                  <SelectTrigger className="rounded-xl h-11 interactive" aria-label="Category type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cname" className="eyebrow">Name</Label>
                <Input id="cname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" className="rounded-xl h-11 interactive" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label className="eyebrow">Colour</Label>
                <div className="flex flex-wrap gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center press interactive ring-offset-2 ring-offset-background ${color === c ? "ring-2 ring-foreground scale-110" : "hover:scale-105"}`}
                      style={{ background: c }}
                      aria-label={`Choose color ${c}`}
                      aria-pressed={color === c}
                    >
                      {color === c && <Check className="h-4 w-4 text-hero" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 press elev-2 bg-gradient-primary text-primary-foreground hover:opacity-95" disabled={add.isPending}>
                {add.isPending ? "Saving…" : "Save category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Type switcher */}
      <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-2xl bg-muted/60 p-1 elev-1" role="tablist" aria-label="Category type">
        {tabs.map(({ value, label, count, Icon }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(value)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 h-10 text-sm font-medium press interactive ${
                active ? "bg-card text-foreground elev-1" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? (value === "income" ? "text-success" : "text-destructive") : ""}`} />
              {label}
              <span className="num text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[84px] w-full rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/70 surface-tint">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
              <Tags className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="section-title">No {filter} categories yet</p>
              <p className="text-sm text-muted-foreground">Create one to start organising your {filter}s.</p>
            </div>
            <Button onClick={() => { setType(filter); setOpen(true); }} variant="outline" className="rounded-xl h-10 gap-2 press interactive">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => {
            const used = usageById.get(c.id) ?? 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: Math.min(i * 0.02, 0.2) }}
              >
                <Card className="group relative overflow-hidden rounded-2xl border-border/70 elev-1 card-hover">
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.color }} aria-hidden="true" />
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-base"
                        style={{ background: c.color + "22", color: c.color, boxShadow: `inset 0 0 0 1px ${c.color}33` }}
                        aria-hidden="true"
                      >
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate leading-tight">{c.name}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {c.is_default ? "Default" : "Custom"}
                          </span>
                          <span className="num text-xs text-muted-foreground">
                            {used > 0 ? `${used} transaction${used > 1 ? "s" : ""}` : "Unused"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!c.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(c)}
                        className="h-9 w-9 shrink-0 rounded-xl press interactive text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                        aria-label={`Delete category ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        description={
          pendingUsage > 0
            ? `${pendingUsage} transaction${pendingUsage > 1 ? "s use" : " uses"} this category. Your transactions and their amounts are kept — they'll simply show as "Uncategorized".`
            : "This category isn't used by any transaction yet."
        }
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
}
