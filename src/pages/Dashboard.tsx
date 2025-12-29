import { useState } from 'react';
import { format } from 'date-fns';
import { useExpenses } from '@/hooks/useExpenses';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { BudgetSettings } from '@/components/budget/BudgetSettings';
import { AIInsights } from '@/components/insights/AIInsights';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { 
    expenses, 
    loading, 
    getSpendingSummary, 
    getTotalSpent, 
    getTotalBudget 
  } = useExpenses();

  const summary = getSpendingSummary();
  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 pb-24 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {format(new Date(), 'MMMM yyyy')}
              </h2>
              <p className="text-muted-foreground">
                Your monthly spending overview
              </p>
            </div>
            
            <QuickStats 
              totalSpent={totalSpent}
              totalBudget={totalBudget}
              expenseCount={expenses.length}
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <SpendingChart data={summary} />
              <BudgetProgress data={summary} />
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Recent Expenses</h2>
              <p className="text-muted-foreground">
                Track and manage your spending
              </p>
            </div>
            <ExpenseList expenses={expenses} />
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Budget Settings</h2>
              <p className="text-muted-foreground">
                Set monthly spending limits
              </p>
            </div>
            <BudgetSettings />
            <BudgetProgress data={summary} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Smart Insights</h2>
              <p className="text-muted-foreground">
                AI-powered spending analysis
              </p>
            </div>
            <AIInsights />
          </div>
        )}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}