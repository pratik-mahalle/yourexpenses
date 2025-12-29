import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RecurringExpense } from '@/types/expense';
import { toast } from 'sonner';

export function useRecurringExpenses() {
  const { user, profile } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const householdId = profile?.household_id;

  const fetchRecurringExpenses = useCallback(async () => {
    if (!householdId) return;

    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecurringExpenses(data as unknown as RecurringExpense[]);
    }
    setLoading(false);
  }, [householdId]);

  const addRecurringExpense = useCallback(async (expense: {
    category_id: string;
    amount: number;
    description: string;
    notes?: string;
    day_of_month: number;
  }) => {
    if (!user || !householdId) {
      toast.error('You must be part of a household to add recurring expenses');
      return { error: new Error('Not in a household') };
    }

    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        ...expense,
        user_id: user.id,
        household_id: householdId
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      toast.error('Failed to add recurring expense');
      return { error };
    }

    setRecurringExpenses(prev => [data as unknown as RecurringExpense, ...prev]);
    toast.success('Recurring expense added!');
    return { data, error: null };
  }, [user, householdId]);

  const updateRecurringExpense = useCallback(async (id: string, updates: Partial<RecurringExpense>) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update recurring expense');
      return { error };
    }

    await fetchRecurringExpenses();
    toast.success('Recurring expense updated!');
    return { error: null };
  }, [fetchRecurringExpenses]);

  const deleteRecurringExpense = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring expense');
      return { error };
    }

    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Recurring expense deleted!');
    return { error: null };
  }, []);

  const toggleRecurringExpense = useCallback(async (id: string, isActive: boolean) => {
    return updateRecurringExpense(id, { is_active: isActive });
  }, [updateRecurringExpense]);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  return {
    recurringExpenses,
    loading,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    fetchRecurringExpenses
  };
}
