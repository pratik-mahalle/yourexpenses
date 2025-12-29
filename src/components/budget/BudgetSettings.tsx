import { useState, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, Save } from 'lucide-react';

export function BudgetSettings() {
  const { categories, budgets, setBudget } = useExpenses();
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const amounts: Record<string, string> = {};
    budgets.forEach(budget => {
      amounts[budget.category_id] = budget.amount.toString();
    });
    setBudgetAmounts(amounts);
  }, [budgets]);

  const handleSave = async (categoryId: string) => {
    const amount = parseFloat(budgetAmounts[categoryId] || '0');
    if (isNaN(amount)) return;

    setSaving(categoryId);
    await setBudget(categoryId, amount);
    setSaving(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Budgets</CardTitle>
        <CardDescription>Set spending limits for each category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
            </div>
            <div className="flex-1">
              <Label htmlFor={`budget-${category.id}`} className="text-sm font-medium">
                {category.name}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`budget-${category.id}`}
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={budgetAmounts[category.id] || ''}
                    onChange={(e) => setBudgetAmounts(prev => ({
                      ...prev,
                      [category.id]: e.target.value
                    }))}
                    className="pl-10"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSave(category.id)}
                  disabled={saving === category.id}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}