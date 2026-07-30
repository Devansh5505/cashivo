import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Trash2 } from "lucide-react";
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

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your income and expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 press"><Plus className="h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-display">New category</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                  <SelectTrigger className="rounded-xl" aria-label="Category type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-all press ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                      aria-label={`Choose color ${c}`}
                      aria-pressed={color === c}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 press" disabled={add.isPending}>
                {add.isPending ? "Saving…" : "Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as "income" | "expense")} className="justify-start">
        <ToggleGroupItem value="expense" className="rounded-xl">Expense</ToggleGroupItem>
        <ToggleGroupItem value="income" className="rounded-xl">Income</ToggleGroupItem>
      </ToggleGroup>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const used = usageById.get(c.id) ?? 0;
            return (
              <Card key={c.id} className="rounded-2xl shadow-soft card-hover">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.color + "22", color: c.color }} aria-hidden="true">
                      <span className="font-bold">{c.name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.is_default ? "Default" : "Custom"}{used > 0 ? ` · ${used} transaction${used > 1 ? "s" : ""}` : ""}
                      </div>
                    </div>
                  </div>
                  {!c.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(c)}
                      className="h-8 w-8 press text-destructive hover:text-destructive shrink-0"
                      aria-label={`Delete category ${c.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
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
