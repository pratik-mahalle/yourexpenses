import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, IndianRupee, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  totalSpent: number;
  totalBudget: number;
  expenseCount: number;
}

export function QuickStats({ totalSpent, totalBudget, expenseCount }: QuickStatsProps) {
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const stats = [
    {
      label: 'Total Spent',
      value: `₹${totalSpent.toFixed(2)}`,
      icon: IndianRupee,
      color: 'bg-primary/10 text-primary',
      iconColor: 'text-primary'
    },
    {
      label: 'Total Budget',
      value: `₹${totalBudget.toFixed(2)}`,
      icon: Target,
      color: 'bg-secondary/10 text-secondary',
      iconColor: 'text-secondary'
    },
    {
      label: 'Remaining',
      value: `₹${Math.abs(remaining).toFixed(2)}`,
      icon: remaining >= 0 ? TrendingDown : TrendingUp,
      color: remaining >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
      iconColor: remaining >= 0 ? 'text-success' : 'text-destructive',
      prefix: remaining < 0 ? '-' : ''
    },
    {
      label: 'Expenses',
      value: expenseCount.toString(),
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
      iconColor: 'text-accent'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={stat.label} className="overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.iconColor)}>
                  {stat.prefix}{stat.value}
                </p>
              </div>
              <div className={cn("p-3 rounded-xl", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}