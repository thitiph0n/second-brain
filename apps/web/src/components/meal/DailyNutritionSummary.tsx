import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Target, TrendingUp, TrendingDown } from 'lucide-react';
import type { DailyNutritionSummary as DailyNutritionSummaryType, MacroPercentages } from '@/types/meal';

interface DailyNutritionSummaryProps {
  summary: DailyNutritionSummaryType | null;
  isLoading?: boolean;
}

export function DailyNutritionSummary({ summary, isLoading }: DailyNutritionSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading nutrition summary...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No nutrition data for this date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate macro percentages
  const macroPercentages: MacroPercentages = {
    protein: summary.total_calories > 0 ? Math.round((summary.total_protein_g * 4 / summary.total_calories) * 100) : 0,
    carbs: summary.total_calories > 0 ? Math.round((summary.total_carbs_g * 4 / summary.total_calories) * 100) : 0,
    fat: summary.total_calories > 0 ? Math.round((summary.total_fat_g * 9 / summary.total_calories) * 100) : 0,
  };

  // Get targets (use TDEE if available, otherwise reasonable defaults)
  const calorieTarget = summary.tdee_calories || summary.bmr_calories || 2000;
  const proteinTarget = Math.round(calorieTarget * 0.25 / 4); // 25% of calories from protein
  const carbsTarget = Math.round(calorieTarget * 0.45 / 4);   // 45% of calories from carbs
  const fatTarget = Math.round(calorieTarget * 0.30 / 9);     // 30% of calories from fat

  // Calculate progress percentages
  const calorieProgress = Math.min((summary.total_calories / calorieTarget) * 100, 100);
  const proteinProgress = Math.min((summary.total_protein_g / proteinTarget) * 100, 100);
  const carbsProgress = Math.min((summary.total_carbs_g / carbsTarget) * 100, 100);
  const fatProgress = Math.min((summary.total_fat_g / fatTarget) * 100, 100);

  // Calorie balance indicator
  const calorieBalance = summary.calorie_balance || (summary.total_calories - calorieTarget);
  const isOverTarget = calorieBalance > 0;
  const balanceColor = Math.abs(calorieBalance) <= 100 ? 'text-green-600' : 
                      isOverTarget ? 'text-red-600' : 'text-blue-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Daily Summary
          <Badge variant="outline" className="ml-auto">
            {new Date(summary.date).toLocaleDateString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Calories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{summary.total_calories}</span>
              <span className="text-muted-foreground">/ {calorieTarget}</span>
              {isOverTarget ? (
                <TrendingUp className={`h-4 w-4 ${balanceColor}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${balanceColor}`} />
              )}
            </div>
          </div>
          <Progress value={calorieProgress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{calorieProgress.toFixed(0)}% of target</span>
            <span className={balanceColor}>
              {isOverTarget ? '+' : ''}{calorieBalance} cal
            </span>
          </div>
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Protein</span>
              <span className="text-sm text-muted-foreground">{macroPercentages.protein}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{summary.total_protein_g}g</span>
              <span className="text-sm text-muted-foreground">/ {proteinTarget}g</span>
            </div>
            <Progress 
              value={proteinProgress} 
              className="h-1.5"
            />
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Carbs</span>
              <span className="text-sm text-muted-foreground">{macroPercentages.carbs}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{summary.total_carbs_g}g</span>
              <span className="text-sm text-muted-foreground">/ {carbsTarget}g</span>
            </div>
            <Progress 
              value={carbsProgress} 
              className="h-1.5"
            />
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Fat</span>
              <span className="text-sm text-muted-foreground">{macroPercentages.fat}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{summary.total_fat_g}g</span>
              <span className="text-sm text-muted-foreground">/ {fatTarget}g</span>
            </div>
            <Progress 
              value={fatProgress} 
              className="h-1.5"
            />
          </div>
        </div>

        {/* BMR/TDEE Info */}
        {(summary.bmr_calories || summary.tdee_calories) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            {summary.bmr_calories && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">BMR</p>
                <p className="font-semibold">{summary.bmr_calories} cal</p>
              </div>
            )}
            {summary.tdee_calories && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">TDEE</p>
                <p className="font-semibold">{summary.tdee_calories} cal</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-center">
            {summary.entries.length} food {summary.entries.length === 1 ? 'entry' : 'entries'} logged
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}