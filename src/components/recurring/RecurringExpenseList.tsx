import { RecurringExpense } from '@/types/expense';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RecurringExpenseListProps {
  expenses: RecurringExpense[];
}

export function RecurringExpenseList({ expenses }: RecurringExpenseListProps) {
  const { deleteRecurringExpense, toggleRecurringExpense } = useRecurringExpenses();

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No recurring expenses</h3>
          <p className="text-muted-foreground text-center">
            Add recurring expenses like subscriptions or bills that repeat monthly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id} className={`overflow-hidden ${!expense.is_active ? 'opacity-60' : ''}`}>
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
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Day {expense.day_of_month}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">
                  ₹{Number(expense.amount).toFixed(2)}
                </span>
                <Switch
                  checked={expense.is_active}
                  onCheckedChange={(checked) => toggleRecurringExpense(expense.id, checked)}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete recurring expense?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{expense.description}". Future expenses will no longer be generated.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteRecurringExpense(expense.id)}
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
  );
}
