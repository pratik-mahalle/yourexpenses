import { Home, Receipt, Target, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { Button } from '@/components/ui/button';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'add', label: 'Add', icon: Plus, isAction: true },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'insights', label: 'Insights', icon: Sparkles }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          if (tab.isAction) {
            return (
              <AddExpenseDialog key={tab.id}>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </AddExpenseDialog>
            );
          }

          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}