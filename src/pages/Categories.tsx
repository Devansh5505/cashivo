import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Trash2 } from "lucide-react";
import { useCategories, useAddCategory, useDeleteCategory } from "@/hooks/useCategories";
import { toast } from "sonner";

const COLORS = ["#10b981", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#64748b"];

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const add = useAddCategory();
  const del = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [filter, setFilter] = useState<"expense" | "income">("expense");

  const list = categories.filter((c) => c.type === filter);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await add.mutateAsync({ name: name.trim(), icon: "Circle", color, type });
      toast.success("Category added");
      setOpen(false);
      setName("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Transactions using it will keep their record.")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your income and expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-display">New category</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl h-11" disabled={add.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as any)} className="justify-start">
        <ToggleGroupItem value="expense" className="rounded-xl">Expense</ToggleGroupItem>
        <ToggleGroupItem value="income" className="rounded-xl">Income</ToggleGroupItem>
      </ToggleGroup>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="rounded-2xl shadow-soft hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: c.color + "22", color: c.color }}>
                    <span className="font-bold">{c.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.is_default ? "Default" : "Custom"}</div>
                  </div>
                </div>
                {!c.is_default && (
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
