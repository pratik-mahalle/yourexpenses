import { SpendingSummary } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  data: SpendingSummary[];
}

export function BudgetProgress({ data }: BudgetProgressProps) {
  const categoriesWithBudgets = data.filter(item => item.budget_amount > 0);

  if (categoriesWithBudgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-muted-foreground text-center">
            Set budgets for your categories to track progress
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categoriesWithBudgets.map((item) => {
          const percentage = Math.min(item.percentage, 100);
          const isOverBudget = item.percentage > 100;
          const isNearLimit = item.percentage >= 80 && item.percentage <= 100;

          return (
            <div key={item.category_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.category_icon}</span>
                  <span className="font-medium">{item.category_name}</span>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "font-semibold",
                    isOverBudget && "text-destructive",
                    isNearLimit && "text-warning"
                  )}>
                    ${item.total_spent.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}/ ${item.budget_amount.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-3",
                    isOverBudget && "[&>div]:bg-destructive",
                    isNearLimit && !isOverBudget && "[&>div]:bg-warning"
                  )}
                />
                {isOverBudget && (
                  <div className="absolute -right-1 -top-1">
                    <span className="text-xs">⚠️</span>
                  </div>
                )}
              </div>
              {isOverBudget && (
                <p className="text-xs text-destructive">
                  Over budget by ${(item.total_spent - item.budget_amount).toFixed(2)}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}