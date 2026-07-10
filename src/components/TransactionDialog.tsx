import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/useCategories";
import { useAddTransaction, useUpdateTransaction, type Transaction } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { toast } from "sonner";

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Wallet", "Other"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTx?: Transaction | null;
  defaultType?: "income" | "expense";
}

export function TransactionDialog({ open, onOpenChange, editTx, defaultType = "expense" }: Props) {
  const { data: categories = [] } = useCategories();
  const add = useAddTransaction();
  const update = useUpdateTransaction();

  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<string>("Cash");

  useEffect(() => {
    if (open) {
      if (editTx) {
        setType(editTx.type);
        setAmount(String(editTx.amount));
        setCategoryId(editTx.category_id ?? "");
        setDate(editTx.date);
        setNote(editTx.note ?? "");
        setPayment(editTx.payment_method ?? "Cash");
      } else {
        setType(defaultType);
        setAmount("");
        setCategoryId("");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setNote("");
        setPayment("Cash");
      }
    }
  }, [open, editTx, defaultType]);

  const filteredCats = categories.filter((c) => c.type === type);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    const payload = {
      type,
      amount: parsed,
      category_id: categoryId,
      date,
      note: note.trim() || null,
      payment_method: payment,
    };
    try {
      if (editTx) {
        await update.mutateAsync({ id: editTx.id, ...payload });
        toast.success("Transaction updated");
      } else {
        await add.mutateAsync(payload);
        toast.success(type === "income" ? "Income added" : "Expense added");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{editTx ? "Edit" : "Add"} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(v) => v && setType(v as "income" | "expense")}
            className="grid grid-cols-2 gap-2"
          >
            <ToggleGroupItem value="expense" className="rounded-xl data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="rounded-xl data-[state=on]:bg-success/10 data-[state=on]:text-success">
              Income
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl h-12 text-2xl font-display font-semibold"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {filteredCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl" placeholder="What was this for?" />
          </div>

          <Button type="submit" className="w-full rounded-xl h-11" disabled={add.isPending || update.isPending}>
            {editTx ? "Save changes" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
