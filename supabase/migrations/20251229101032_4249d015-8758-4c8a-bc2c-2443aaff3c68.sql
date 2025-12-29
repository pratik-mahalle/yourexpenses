-- Add foreign key from expenses.user_id to profiles.id
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;