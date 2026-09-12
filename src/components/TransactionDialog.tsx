import { useEffect, useMemo, useState } from "react";
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
import { errorMessage } from "@/lib/errors";

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

  const filteredCats = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  const saving = add.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // guard against double submits (Enter key, double click)
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return toast.error("Enter an amount greater than zero.");
    if (parsed > 1_000_000_000) return toast.error("That amount is too large.");
    if (!date || Number.isNaN(new Date(date).getTime())) return toast.error("Pick a valid date.");
    if (!categoryId) return toast.error("Pick a category.");
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
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save this transaction."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl elev-3 sm:max-w-md">
        <DialogHeader className="space-y-1 text-left">
          <p className="eyebrow">{editTx ? "Update record" : "New record"}</p>
          <DialogTitle className="font-display text-xl">{editTx ? "Edit" : "Add"} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(v) => { if (!v) return; setType(v as "income" | "expense"); setCategoryId(""); }}
            className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1"
          >
            <ToggleGroupItem
              value="expense"
              className="rounded-xl h-10 text-sm font-medium interactive data-[state=on]:bg-destructive/12 data-[state=on]:text-destructive data-[state=on]:shadow-none"
            >
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem
              value="income"
              className="rounded-xl h-10 text-sm font-medium interactive data-[state=on]:bg-success/12 data-[state=on]:text-success data-[state=on]:shadow-none"
            >
              Income
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-2">
            <Label htmlFor="amount" className="eyebrow">Amount</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`rounded-xl h-14 text-3xl font-display font-semibold num interactive ${type === "income" ? "text-success" : "text-destructive"}`}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category" className="eyebrow">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category" aria-label="Category" className="rounded-xl h-11 interactive"><SelectValue placeholder="Select" /></SelectTrigger>

                <SelectContent>
                  {filteredCats.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                      No {type} categories yet — add one on the Categories page.
                    </div>
                  )}
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
              <Label htmlFor="date" className="eyebrow">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-11 num interactive" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment" className="eyebrow">Payment method</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger id="payment" aria-label="Payment method" className="rounded-xl h-11 interactive"><SelectValue /></SelectTrigger>

              <SelectContent>
                {PAYMENT_METHODS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="eyebrow">Note (optional)</Label>
            <Textarea id="note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl min-h-[80px] resize-none interactive" placeholder="What was this for?" />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl h-12 press elev-2 bg-gradient-primary text-primary-foreground hover:opacity-95"
            disabled={add.isPending || update.isPending}
          >
            {add.isPending || update.isPending ? "Saving…" : editTx ? "Save changes" : "Save transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

