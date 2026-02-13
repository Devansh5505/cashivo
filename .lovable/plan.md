

# Simple Expense Tracker

A local-only expense tracker with visual spending insights — no login required, data stored in your browser.

## Pages & Layout

### Main Dashboard
- **Summary cards** at the top showing: total spent this month, number of transactions, and top spending category
- **Charts section** with a pie chart (spending by category) and a bar chart (daily or weekly spending over the current month)
- **Quick-add button** to log a new expense

### Expense List
- Scrollable list of all expenses, newest first
- Each entry shows: amount, category, date, and optional note
- Ability to delete an expense
- Filter by category or date range

### Add/Edit Expense
- Simple form (modal or inline): amount, category (dropdown with common presets like Food, Transport, Entertainment, Bills, Shopping, Other), date, and optional note

## Key Behaviors
- All data stored in **localStorage** so it persists across sessions (no backend needed)
- Currency displayed as **$** (USD) by default
- Charts update automatically as expenses are added or removed
- Responsive design — works well on both desktop and mobile

## Design
- Clean, minimal interface using the existing shadcn/ui components
- Tabs or simple navigation to switch between Dashboard and Expense List views

