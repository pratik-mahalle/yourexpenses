-- Create recurring expenses table
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_month DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view recurring expenses"
ON public.recurring_expenses FOR SELECT
USING (is_household_member(auth.uid(), household_id));

CREATE POLICY "Members can create recurring expenses"
ON public.recurring_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_household_member(auth.uid(), household_id));

CREATE POLICY "Users can update own recurring expenses"
ON public.recurring_expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring expenses"
ON public.recurring_expenses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();