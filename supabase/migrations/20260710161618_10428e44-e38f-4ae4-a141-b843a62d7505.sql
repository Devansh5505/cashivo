-- Enums
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.category_type AS ENUM ('income', 'expense');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Circle',
  color TEXT NOT NULL DEFAULT '#10b981',
  type public.category_type NOT NULL DEFAULT 'expense',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads defaults or their own" ON public.categories
  FOR SELECT TO authenticated
  USING (is_default = true OR user_id = auth.uid());
CREATE POLICY "Users insert own categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_default = false);
CREATE POLICY "Users update own categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_default = false)
  WITH CHECK (user_id = auth.uid() AND is_default = false);
CREATE POLICY "Users delete own categories" ON public.categories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND is_default = false);
CREATE INDEX idx_categories_user ON public.categories(user_id);

-- Seed default categories
INSERT INTO public.categories (name, icon, color, type, is_default) VALUES
  ('Food', 'UtensilsCrossed', '#f97316', 'expense', true),
  ('Grocery', 'ShoppingBasket', '#22c55e', 'expense', true),
  ('Shopping', 'ShoppingBag', '#ec4899', 'expense', true),
  ('Transport', 'Bus', '#3b82f6', 'expense', true),
  ('Fuel', 'Fuel', '#ef4444', 'expense', true),
  ('Rent', 'Home', '#8b5cf6', 'expense', true),
  ('Bills', 'Receipt', '#f59e0b', 'expense', true),
  ('Entertainment', 'Film', '#a855f7', 'expense', true),
  ('Education', 'GraduationCap', '#06b6d4', 'expense', true),
  ('Medical', 'HeartPulse', '#dc2626', 'expense', true),
  ('Travel', 'Plane', '#0ea5e9', 'expense', true),
  ('Investment', 'TrendingUp', '#10b981', 'expense', true),
  ('Others', 'Circle', '#64748b', 'expense', true),
  ('Salary', 'Wallet', '#10b981', 'income', true),
  ('Freelance', 'Briefcase', '#14b8a6', 'income', true),
  ('Investment', 'TrendingUp', '#22c55e', 'income', true),
  ('Other Income', 'PlusCircle', '#84cc16', 'income', true);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);