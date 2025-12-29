export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  household_id: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  profile?: Profile;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecurringExpense {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  notes: string | null;
  day_of_month: number;
  is_active: boolean;
  last_generated_month: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  household_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  created_by: string | null;
}

export interface SpendingSummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_spent: number;
  budget_amount: number;
  percentage: number;
}