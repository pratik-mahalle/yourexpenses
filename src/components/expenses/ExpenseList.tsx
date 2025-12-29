import { format } from 'date-fns';
import { Expense } from '@/types/expense';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const { deleteExpense } = useExpenses();

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No expenses yet</h3>
          <p className="text-muted-foreground text-center">
            Start tracking your expenses by adding your first one!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const dateKey = expense.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedExpenses).map(([dateKey, dayExpenses]) => (
        <div key={dateKey} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(new Date(dateKey), 'EEEE, MMMM d')}
          </h3>
          <div className="space-y-2">
            {dayExpenses.map((expense) => (
              <Card key={expense.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: `${expense.category?.color}20` }}
                    >
                      {expense.category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{expense.category?.name}</span>
                        {expense.profile && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[10px]">
                                  {expense.profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">
                                {expense.profile.display_name || 'Unknown'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        ${Number(expense.amount).toFixed(2)}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{expense.description}" (${Number(expense.amount).toFixed(2)}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteExpense(expense.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}