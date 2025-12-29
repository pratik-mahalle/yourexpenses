import { useState, useEffect } from 'react';
import { Profile } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth } from 'date-fns';

interface MemberSpending {
  profile: Profile;
  totalSpent: number;
  expenseCount: number;
}

interface FamilySpendingProfileProps {
  householdId: string;
}

export function FamilySpendingProfile({ householdId }: FamilySpendingProfileProps) {
  const [members, setMembers] = useState<MemberSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHouseholdSpending, setTotalHouseholdSpending] = useState(0);

  useEffect(() => {
    const fetchMemberSpending = async () => {
      setLoading(true);
      
      // Fetch all household members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', householdId);

      if (profilesError || !profiles) {
        setLoading(false);
        return;
      }

      // Fetch expenses for current month
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthEnd = format(startOfMonth(nextMonth), 'yyyy-MM-dd');

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('user_id, amount')
        .eq('household_id', householdId)
        .gte('date', monthStart)
        .lt('date', monthEnd);

      if (expensesError) {
        setLoading(false);
        return;
      }

      // Calculate spending per member
      const memberSpending: MemberSpending[] = profiles.map((profile) => {
        const memberExpenses = expenses?.filter(e => e.user_id === profile.id) || [];
        const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        
        return {
          profile: profile as Profile,
          totalSpent,
          expenseCount: memberExpenses.length
        };
      });

      // Sort by spending (highest first)
      memberSpending.sort((a, b) => b.totalSpent - a.totalSpent);

      const total = memberSpending.reduce((sum, m) => sum + m.totalSpent, 0);
      setTotalHouseholdSpending(total);
      setMembers(memberSpending);
      setLoading(false);
    };

    if (householdId) {
      fetchMemberSpending();
    }
  }, [householdId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No members found</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Family Spending This Month</p>
        <p className="text-lg font-bold text-primary">
          ${totalHouseholdSpending.toFixed(2)}
        </p>
      </div>
      
      <div className="space-y-4">
        {members.map((member) => {
          const percentage = totalHouseholdSpending > 0 
            ? (member.totalSpent / totalHouseholdSpending) * 100 
            : 0;
          
          return (
            <div key={member.profile.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {member.profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profile.display_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.expenseCount} expense{member.expenseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">
                  ${member.totalSpent.toFixed(2)}
                </p>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
