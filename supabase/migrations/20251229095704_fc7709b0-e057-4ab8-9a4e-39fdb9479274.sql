-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'member');

-- Create households table
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for household roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, household_id)
);

-- Create categories table with default categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budgets table (per category, per month)
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (household_id, category_id, month)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Security definer function to check household membership
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND household_id = _household_id
  )
$$;

-- Security definer function to get user's household
CREATE OR REPLACE FUNCTION public.get_user_household(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = _user_id
$$;

-- Security definer function to check if user has role in household
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Household members can view each other" ON public.profiles
  FOR SELECT USING (
    household_id IS NOT NULL AND 
    public.is_household_member(auth.uid(), household_id)
  );

-- Households policies
CREATE POLICY "Members can view their household" ON public.households
  FOR SELECT USING (public.is_household_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create households" ON public.households
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update household" ON public.households
  FOR UPDATE USING (created_by = auth.uid());

-- User roles policies
CREATE POLICY "Members can view roles in their household" ON public.user_roles
  FOR SELECT USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Owners can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "View default categories" ON public.categories
  FOR SELECT USING (is_default = true);

CREATE POLICY "View household categories" ON public.categories
  FOR SELECT USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can update categories" ON public.categories
  FOR UPDATE USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can delete categories" ON public.categories
  FOR DELETE USING (public.is_household_member(auth.uid(), household_id) AND is_default = false);

-- Budgets policies
CREATE POLICY "Members can view budgets" ON public.budgets
  FOR SELECT USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create budgets" ON public.budgets
  FOR INSERT WITH CHECK (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can update budgets" ON public.budgets
  FOR UPDATE USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can delete budgets" ON public.budgets
  FOR DELETE USING (public.is_household_member(auth.uid(), household_id));

-- Expenses policies
CREATE POLICY "Members can view expenses" ON public.expenses
  FOR SELECT USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    public.is_household_member(auth.uid(), household_id)
  );

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, icon, color, is_default) VALUES
  ('Food & Groceries', '🛒', '#22C55E', true),
  ('Transportation', '🚗', '#3B82F6', true),
  ('Entertainment', '🎬', '#EC4899', true),
  ('Utilities', '💡', '#F59E0B', true),
  ('Shopping', '🛍️', '#8B5CF6', true),
  ('Healthcare', '🏥', '#EF4444', true),
  ('Education', '📚', '#06B6D4', true),
  ('Travel', '✈️', '#14B8A6', true),
  ('Other', '📦', '#6B7280', true);