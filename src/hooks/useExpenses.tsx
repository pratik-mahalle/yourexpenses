import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Expense, Category, Budget, SpendingSummary } from '@/types/expense';
import { toast } from 'sonner';
import { startOfMonth, format } from 'date-fns';

export function useExpenses() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const householdId = profile?.household_id;

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true${householdId ? `,household_id.eq.${householdId}` : ''}`);

    if (!error && data) {
      setCategories(data as Category[]);
    }
  }, [householdId]);

  const fetchExpenses = useCallback(async (month?: Date) => {
    if (!householdId) return;

    const targetMonth = month || new Date();
    const monthStart = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
    const nextMonth = new Date(targetMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = format(startOfMonth(nextMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        profile:profiles(*)
      `)
      .eq('household_id', householdId)
      .gte('date', monthStart)
      .lt('date', monthEnd)
      .order('date', { ascending: false });

    if (!error && data) {
      setExpenses(data as unknown as Expense[]);
    }
  }, [householdId]);

  const fetchBudgets = useCallback(async (month?: Date) => {
    if (!householdId) return;

    const targetMonth = month || new Date();
    const monthStr = format(startOfMonth(targetMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('household_id', householdId)
      .eq('month', monthStr);

    if (!error && data) {
      setBudgets(data as unknown as Budget[]);
    }
  }, [householdId]);

  const addExpense = useCallback(async (expense: {
    category_id: string;
    amount: number;
    description: string;
    notes?: string;
    date: string;
    receipt_url?: string;
  }) => {
    if (!user || !householdId) {
      toast.error('You must be part of a household to add expenses');
      return { error: new Error('Not in a household') };
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        user_id: user.id,
        household_id: householdId
      })
      .select(`
        *,
        category:categories(*),
        profile:profiles(*)
      `)
      .single();

    if (error) {
      toast.error('Failed to add expense');
      return { error };
    }

    setExpenses(prev => [data as unknown as Expense, ...prev]);
    toast.success('Expense added!');
    return { data, error: null };
  }, [user, householdId]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update expense');
      return { error };
    }

    await fetchExpenses();
    toast.success('Expense updated!');
    return { error: null };
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete expense');
      return { error };
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Expense deleted!');
    return { error: null };
  }, []);

  const setBudget = useCallback(async (categoryId: string, amount: number, month?: Date) => {
    if (!householdId) return { error: new Error('Not in a household') };

    const targetMonth = month || new Date();
    const monthStr = format(startOfMonth(targetMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        household_id: householdId,
        category_id: categoryId,
        amount,
        month: monthStr
      }, {
        onConflict: 'household_id,category_id,month'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to set budget');
      return { error };
    }

    await fetchBudgets(month);
    toast.success('Budget updated!');
    return { data, error: null };
  }, [householdId, fetchBudgets]);

  const getSpendingSummary = useCallback((): SpendingSummary[] => {
    const summary: SpendingSummary[] = [];

    categories.forEach(category => {
      const categoryExpenses = expenses.filter(e => e.category_id === category.id);
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const budget = budgets.find(b => b.category_id === category.id);
      const budgetAmount = budget ? Number(budget.amount) : 0;
      const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

      if (totalSpent > 0 || budgetAmount > 0) {
        summary.push({
          category_id: category.id,
          category_name: category.name,
          category_icon: category.icon,
          category_color: category.color,
          total_spent: totalSpent,
          budget_amount: budgetAmount,
          percentage
        });
      }
    });

    return summary.sort((a, b) => b.total_spent - a.total_spent);
  }, [categories, expenses, budgets]);

  const getTotalSpent = useCallback(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const getTotalBudget = useCallback(() => {
    return budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  }, [budgets]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategories();
      if (householdId) {
        await Promise.all([fetchExpenses(), fetchBudgets()]);
      }
      setLoading(false);
    };

    loadData();
  }, [householdId, fetchCategories, fetchExpenses, fetchBudgets]);

  return {
    expenses,
    categories,
    budgets,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget,
    getSpendingSummary,
    getTotalSpent,
    getTotalBudget,
    fetchExpenses,
    fetchBudgets,
    fetchCategories
  };
}