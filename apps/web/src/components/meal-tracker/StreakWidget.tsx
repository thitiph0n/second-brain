import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Calendar } from 'lucide-react';
import type { Streak } from '@/types/meal-tracker';

interface StreakWidgetProps {
  streak: Streak;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
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
  if (streak.current_streak >= 7) achievements.push({ label: '7-Day Streak', icon: '🔥' });
  if (streak.current_streak >= 30) achievements.push({ label: '30-Day Streak', icon: '⭐' });
  if (streak.current_streak >= 100) achievements.push({ label: '100-Day Streak', icon: '👑' });
  if (streak.longest_streak >= 365) achievements.push({ label: 'Year Warrior', icon: '🏆' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Streak</CardTitle>
            <CardDescription>{getMilestoneMessage(streak.current_streak)}</CardDescription>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Streak */}
          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
            <Flame className={`h-12 w-12 mb-2 ${getStreakColor(streak.current_streak)}`} />
            <div className="text-4xl font-bold mb-1">{streak.current_streak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </div>

          {/* Longest Streak */}
          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <Trophy className="h-12 w-12 mb-2 text-yellow-600 dark:text-yellow-400" />
            <div className="text-4xl font-bold mb-1">{streak.longest_streak}</div>
            <div className="text-sm text-muted-foreground">Longest Streak</div>
          </div>

          {/* Total Logged Days */}
          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <Calendar className="h-12 w-12 mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-4xl font-bold mb-1">{streak.total_logged_days}</div>
            <div className="text-sm text-muted-foreground">Total Days Logged</div>
          </div>
        </div>

        {/* Freeze Credits */}
        {streak.freeze_credits > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted text-center">
            <div className="text-sm font-medium">
              ❄️ {streak.freeze_credits} Freeze Credit{streak.freeze_credits !== 1 ? 's' : ''} Available
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Use a freeze to protect your streak if you miss a day
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
