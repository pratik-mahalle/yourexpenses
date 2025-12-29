-- Add unique constraint for budget upsert to work
ALTER TABLE public.budgets
ADD CONSTRAINT budgets_household_category_month_unique 
UNIQUE (household_id, category_id, month);