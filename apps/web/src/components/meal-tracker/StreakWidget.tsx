import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';
import type { Streak } from '@/types/meal-tracker';

interface StreakWidgetProps {
  streak?: Streak | null;
  isLoading?: boolean;
}

export function StreakWidget({ streak, isLoading = false }: StreakWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted">
                <Skeleton className="h-12 w-12 mb-2" />
                <Skeleton className="h-8 w-8 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
          <CardDescription>No streak data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const getMilestoneMessage = (currentStreak: number) => {
    if (currentStreak === 0) return 'Start your journey today!';
    if (currentStreak < 7) return 'Great start! Keep it up!';
    if (currentStreak < 30) return 'You\'re on fire! 🔥';
    if (currentStreak < 100) return 'Incredible consistency! 🌟';
    return 'You\'re a legend! 👑';
  };

  const getStreakColor = (currentStreak: number) => {
    if (currentStreak === 0) return 'text-muted-foreground';
    if (currentStreak < 7) return 'text-orange-500';
    if (currentStreak < 30) return 'text-orange-600';
    return 'text-red-500';
  };

  const achievements = [];
  if (streak.currentStreak >= 7) achievements.push({ label: '7-Day Streak', icon: '🔥' });
  if (streak.currentStreak >= 30) achievements.push({ label: '30-Day Streak', icon: '⭐' });
  if (streak.currentStreak >= 100) achievements.push({ label: '100-Day Streak', icon: '👑' });
  if (streak.longestStreak >= 365) achievements.push({ label: 'Year Warrior', icon: '🏆' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Streak</CardTitle>
            <CardDescription>{getMilestoneMessage(streak.currentStreak)}</CardDescription>
          </div>
          {achievements.length > 0 && (
            <div className="flex gap-1">
              {achievements.map((achievement) => (
                <Badge
                  key={achievement.label}
                  variant="secondary"
                  className="text-lg"
                  title={achievement.label}
                >
                  {achievement.icon}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Streak */}
        <div className="flex flex-col items-center justify-center p-6">
          <Flame className={`h-12 w-12 mb-2 ${getStreakColor(streak.currentStreak)}`} />
          <div className="text-4xl font-bold mb-1">{streak.currentStreak}</div>
          <div className="text-sm text-muted-foreground">Days</div>
        </div>
      </CardContent>
    </Card>
  );
}
