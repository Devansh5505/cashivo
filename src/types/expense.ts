export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date string
  note?: string;
}

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Entertainment"
  | "Bills"
  | "Shopping"
  | "Other";

export const CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Entertainment",
  "Bills",
  "Shopping",
  "Other",
];
