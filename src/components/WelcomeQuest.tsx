import React, { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WelcomeQuestProps {
  userId: string;
}

const WelcomeQuest: React.FC<WelcomeQuestProps> = ({ userId }) => {
  const [progressPercent, setProgressPercent] = useState(0);
  
  useEffect(() => {
    Preferences.get({ key: `user_progress_${userId}` }).then(({ value }) => {
      if (value) {
        const { quizCompleted, chatsStarted, eventsJoined, profileCompleted } = JSON.parse(value);
        const total = (quizCompleted + (chatsStarted >= 5 ? 1 : 0) + (eventsJoined >= 3 ? 1 : 0) + profileCompleted) / 4 * 100;
        setProgressPercent(total);
      }
    });
  }, [userId]);

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Welcome Quest</h3>
      <Progress value={progressPercent} className="mb-2" />
      <p className="text-sm text-muted-foreground">{Math.round(progressPercent)}% Complete</p>
    </Card>
  );
};

export default WelcomeQuest;
