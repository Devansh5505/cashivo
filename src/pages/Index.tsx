import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExpenses } from "@/hooks/useExpenses";
import { Dashboard } from "@/components/Dashboard";
import { ExpenseList } from "@/components/ExpenseList";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";

const Index = () => {
  const { expenses, addExpense, deleteExpense } = useExpenses();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Expense Tracker</h1>
          <AddExpenseDialog onAdd={addExpense} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Dashboard expenses={expenses} />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpenseList expenses={expenses} onDelete={deleteExpense} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
