-- Allow users to view households they created (needed for INSERT...RETURNING)
CREATE POLICY "Creators can view their household" ON public.households
  FOR SELECT USING (created_by = auth.uid());