import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Household, Profile } from '@/types/expense';
import { toast } from 'sonner';

export function useHousehold() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createHousehold = useCallback(async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    setLoading(true);
    try {
      // Create the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (householdError) throw householdError;

      // Update user's profile with household_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ household_id: household.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Add user as owner in user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: user.id, 
          household_id: household.id, 
          role: 'owner' 
        });

      if (roleError) throw roleError;

      await refreshProfile();
      toast.success('Household created successfully!');
      return { data: household as Household, error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [user, refreshProfile]);

  const joinHousehold = useCallback(async (inviteCode: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    setLoading(true);
    try {
      // Find household by invite code
      const { data: household, error: findError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.toLowerCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!household) throw new Error('Invalid invite code');

      // Update user's profile with household_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ household_id: household.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Add user as member in user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: user.id, 
          household_id: household.id, 
          role: 'member' 
        });

      if (roleError) throw roleError;

      await refreshProfile();
      toast.success('Joined household successfully!');
      return { data: household as Household, error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [user, refreshProfile]);

  const getHousehold = useCallback(async () => {
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) return null;

    const { data } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();

    return data as Household | null;
  }, [user]);

  const getHouseholdMembers = useCallback(async (householdId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('household_id', householdId);

    return (data || []) as Profile[];
  }, []);

  return {
    loading,
    createHousehold,
    joinHousehold,
    getHousehold,
    getHouseholdMembers
  };
}