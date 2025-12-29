import { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Insight {
  type: 'tip' | 'warning' | 'trend';
  title: string;
  description: string;
}

export function AIInsights() {
  const { expenses, getSpendingSummary, getTotalSpent, getTotalBudget } = useExpenses();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = () => {
    if (expenses.length === 0) {
      toast.error('Add some expenses first to get insights');
      return;
    }

    setLoading(true);
    try {
      generateLocalInsights();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalInsights = () => {
    const summary = getSpendingSummary();
    const localInsights: Insight[] = [];

    // Check for over-budget categories
    summary.forEach(cat => {
      if (cat.percentage > 100) {
        localInsights.push({
          type: 'warning',
          title: `${cat.category_name} Over Budget`,
          description: `You've exceeded your ${cat.category_name} budget by $${(cat.total_spent - cat.budget_amount).toFixed(2)}. Consider reducing spending in this category.`
        });
      } else if (cat.percentage > 80) {
        localInsights.push({
          type: 'warning',
          title: `${cat.category_name} Near Limit`,
          description: `You've used ${cat.percentage.toFixed(0)}% of your ${cat.category_name} budget. Only $${(cat.budget_amount - cat.total_spent).toFixed(2)} remaining.`
        });
      }
    });

    // Find highest spending category
    if (summary.length > 0) {
      const highest = summary[0];
      localInsights.push({
        type: 'trend',
        title: 'Top Spending Category',
        description: `${highest.category_name} is your highest spending category at $${highest.total_spent.toFixed(2)} this month.`
      });
    }

    // General tip
    localInsights.push({
      type: 'tip',
      title: 'Track Regularly',
      description: 'Recording expenses daily helps you stay aware of your spending patterns and catch overspending early.'
    });

    setInsights(localInsights);
    setHasGenerated(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'trend':
        return <TrendingDown className="h-5 w-5 text-secondary" />;
      default:
        return <Lightbulb className="h-5 w-5 text-accent" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your spending habits
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateInsights}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {hasGenerated ? 'Refresh' : 'Generate'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasGenerated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-muted-foreground">
              Click "Generate" to get personalized insights about your spending
            </p>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-muted-foreground">
              Great job! No issues found with your spending.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mt-0.5">{getIcon(insight.type)}</div>
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}