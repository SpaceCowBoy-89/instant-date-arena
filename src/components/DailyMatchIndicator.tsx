
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap } from "lucide-react";
import { useMatchLimits } from "@/hooks/useMatchLimits";

const DailyMatchIndicator = () => {
  const { matchLimits, loading } = useMatchLimits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-romance" />
            Daily Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matchLimits) {
    return null;
  }

  const usagePercentage = (matchLimits.matches_used / matchLimits.daily_limit) * 100;
  const remainingMatches = matchLimits.daily_limit - matchLimits.matches_used;
  
  // Color coding based on usage
  const getTextColor = () => {
    if (usagePercentage >= 90) return "text-destructive";
    if (usagePercentage >= 70) return "text-yellow-600";
    return "text-romance";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-romance" />
          Daily Matches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getTextColor()}`}>
            {remainingMatches}
          </div>
          <p className="text-sm text-muted-foreground">
            matches remaining today
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {matchLimits.matches_used}/{matchLimits.daily_limit}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className="w-full"
          />
        </div>

        {usagePercentage >= 80 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <Zap className="h-3 w-3" />
            <span>
              {usagePercentage >= 100 
                ? "Get more matches in billing!" 
                : "Running low on matches today"
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyMatchIndicator;
