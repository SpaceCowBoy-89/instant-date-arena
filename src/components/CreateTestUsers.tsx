import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function CreateTestUsers() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateUsers = async () => {
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `Test users created successfully. Results: ${JSON.stringify(data.results)}`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create test users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={handleCreateUsers}
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? 'Creating Test Users...' : 'Create Test Users'}
      </Button>
    </div>
  );
}