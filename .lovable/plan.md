# Cashivo — Rebrand & Phased Rollout

Full rebrand + premium redesign delivered in phases. Backend on Lovable Cloud with ₹ INR as default (currency picker in Settings).

---

## Phase 1 — Rebrand, redesign & core (this build)

### Brand identity
- Rename **Budget Buddy → Cashivo** everywhere (page title, header, meta, README, storage keys, OG tags).
- Palette: **emerald green** (primary), **charcoal** (foreground), **white/off-white** (background), soft emerald→teal gradient accents, subtle shadows. Wired via `index.css` HSL tokens + tailwind config — no hardcoded colors in components.
- Typography: **Sora** (display, for headings/logo) + **Inter** (body) via Google Fonts.
- Logo: SVG letter **"C"** shaped like a wallet with a small upward-trend line inside (charcoal glyph on emerald gradient, rounded-square badge). Reused in header, splash, favicon, PWA icon.
- New favicon (PNG generated from logo), updated OG/Twitter meta.

### Design system upgrade
- Rounded cards (`rounded-2xl`), soft layered shadows (`shadow-elegant` token), consistent 4/8/16/24 spacing scale, smooth 200ms transitions.
- **Light + Dark mode** with `next-themes`, toggle in header, tokens defined for both.
- Fully responsive: mobile-first, tablet, desktop breakpoints. Bottom-tab nav on mobile, sidebar on desktop.
- Framer-motion page transitions + subtle card hover/enter animations. Skeleton loaders.

### Backend (Lovable Cloud)
- Enable Cloud. Email/password + Google auth. Dedicated **/auth** page. Protected routes.
- `profiles` table (display_name, currency default `INR`, theme).
- Tables (all with RLS scoped to `auth.uid()`):
  - `categories` (name, icon, color, type expense/income, is_default, user_id nullable for defaults)
  - `transactions` (amount, type expense/income, category_id, date, note, payment_method, user_id)
- Seed 13 default categories (Food, Grocery, Shopping, Transport, Fuel, Rent, Bills, Entertainment, Education, Medical, Travel, Investment, Others) + income defaults (Salary, Freelance, Investment, Other).
- Migrate existing localStorage expenses into Cloud on first login (one-time import banner).

### Pages (Phase 1)
1. **/auth** — sign in / sign up with Cashivo branding, Google button.
2. **Onboarding** (3 slides shown once): welcome, track effortlessly, insights — with illustrations, "Get started" CTA.
3. **/ (Dashboard)** —
   - Hero: current **balance** card with gradient background.
   - Stat cards: **Total income**, **Total expenses**, **Savings** (this month).
   - **Monthly cash flow** line chart (income vs expense, last 6 months).
   - **Spending by category** donut.
   - **Recent transactions** (last 5) with icons.
   - **Quick actions**: Add Expense, Add Income (Transfer stubbed for later phase).
4. **/transactions** — searchable + filterable list (category, date range, payment method, amount, type), add/edit/delete via dialog. Category, amount, date, note, payment method fields.
5. **/categories** — view defaults + create custom (name, icon from lucide, color, type).
6. **/settings** — profile, currency picker (default INR), theme toggle, logout.

### Navigation
- Header with logo + theme toggle + user menu.
- Desktop sidebar (Dashboard, Transactions, Categories, Settings).
- Mobile bottom tab bar.

### Deliverables
- All existing expense functionality preserved & migrated.
- Empty states with illustrations, toast success/error, loading skeletons everywhere.

---

## Later phases (not built now)

- **Phase 2**: Budgets (monthly + category-wise, progress bars, warnings), Goals (savings targets with progress + completion celebration).
- **Phase 3**: Analytics page (pie, weekly activity, yearly overview, top categories, income vs expense).
- **Phase 4**: Calendar view, Recurring transactions, Receipt image attachments (Cloud Storage).
- **Phase 5**: Export CSV/PDF, Import, Backup/Restore, Notification reminders (bill/budget/savings), PIN lock, multi-currency full rollout.

---

## Technical notes
- Stack additions: `next-themes`, `framer-motion`, `react-router-dom` (already in), react-hook-form + zod for forms.
- File structure: `src/features/{auth,dashboard,transactions,categories,settings}/` with colocated components + hooks. Shared UI stays in `src/components/ui/`. Data access via `src/lib/api/` hooks using supabase client.
- All colors as HSL tokens; new gradient/shadow tokens in `index.css`; component variants via `cva`.

Approve to build Phase 1.