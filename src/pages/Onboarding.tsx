import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHousehold } from '@/hooks/useHousehold';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Users, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { createHousehold, joinHousehold, loading } = useHousehold();
  
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) return;
    
    const { error } = await createHousehold(householdName);
    if (!error) {
      navigate('/');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    const { error } = await joinHousehold(inviteCode);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary">
            <Home className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Household</CardTitle>
          <CardDescription>
            Create a new household or join an existing one to start tracking expenses together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Existing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="household-name">Household Name</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="household-name"
                      type="text"
                      placeholder="e.g., Smith Family"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Household'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="join">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invite-code"
                      type="text"
                      placeholder="Enter 8-character code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="pl-10"
                      maxLength={8}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ask a household member for the invite code
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Household'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}