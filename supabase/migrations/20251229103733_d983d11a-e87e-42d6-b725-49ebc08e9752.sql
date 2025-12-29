-- Drop existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Household members can view each other" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate SELECT policies with explicit authentication requirement
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Household members can view each other" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  household_id IS NOT NULL 
  AND is_household_member(auth.uid(), household_id)
);