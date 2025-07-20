
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MatchLimits {
  matches_used: number;
  daily_limit: number;
  date: string;
}

export const useMatchLimits = () => {
  const [matchLimits, setMatchLimits] = useState<MatchLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMatchLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_match_limits')
        .select('matches_used, daily_limit, date')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) {
        console.error('Error fetching match limits:', error);
        toast({
          title: "Error",
          description: "Failed to load match usage data",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setMatchLimits(data);
      } else {
        // No record exists yet, set default values
        setMatchLimits({
          matches_used: 0,
          daily_limit: 10,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error in fetchMatchLimits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchLimits();
  }, []);

  return {
    matchLimits,
    loading,
    refetchMatchLimits: fetchMatchLimits
  };
};
