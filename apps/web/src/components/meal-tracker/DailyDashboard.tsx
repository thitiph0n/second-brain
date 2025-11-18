import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Beef, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Droplets, Flame, Plus, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailySummary, useMeals, useUserProfile } from "@/hooks/meal-tracker";
import { cn, getLocalDateString, getMealTypeByTime } from "@/lib/utils";
import type { MealType } from "@/types/meal-tracker";
import { FavoritesList } from "./FavoritesList";
import { MealList } from "./MealList";
import { TrendChart } from "./TrendChart";

export function DailyDashboard() {
	const navigate = useNavigate();
	const { data: profile, isLoading: profileLoading } = useUserProfile();

	const [selectedDate, setSelectedDate] = useState(getLocalDateString());
	const today = getLocalDateString();
	const isToday = selectedDate === today;

	const { data: mealsData, isLoading: mealsLoading } = useMeals({ startDate: selectedDate });
	const { data: dailySummaryData, isLoading: summaryLoading } = useDailySummary(selectedDate);

	const meals = mealsData?.meals || [];
	const dailySummaryFromAPI = dailySummaryData?.dailySummary || null;

	// Calculate daily totals for selected date if we don't have summary from API
	const calculatedDailySummary = useMemo(() => {
		if (dailySummaryFromAPI) return dailySummaryFromAPI;

		// Use the same local date logic
		const selectedDateMeals = meals.filter((meal) => meal.loggedAt.split("T")[0] === selectedDate);

		return {
			date: selectedDate,
			totalCalories: selectedDateMeals.reduce((sum, meal) => sum + meal.calories, 0),
			totalProteinG: selectedDateMeals.reduce((sum, meal) => sum + meal.proteinG, 0),
			totalCarbsG: selectedDateMeals.reduce((sum, meal) => sum + meal.carbsG, 0),
			totalFatG: selectedDateMeals.reduce((sum, meal) => sum + meal.fatG, 0),
			mealCount: selectedDateMeals.length,
			targetCalories: profile?.targetCalories || 0,
		};
	}, [meals, profile, dailySummaryFromAPI, selectedDate]);

	// Loading states
	const isLoading = profileLoading || mealsLoading || summaryLoading;

	// Handle loading state
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-96" />
					</div>
					<Skeleton className="h-12 w-32" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4">
							<Skeleton className="h-32 w-32 rounded-full mb-4 mx-auto" />
							<Skeleton className="h-4 w-20 mb-2 mx-auto" />
							<Skeleton className="h-6 w-24 mx-auto" />
						</CardContent>
					</Card>
					<Card className="lg:col-span-2">
						<CardContent className="p-4">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{[1, 2, 3].map((i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-6 w-12" />
										<Skeleton className="h-2 w-full" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (!profile) {
		return null;
	}

	const calorieProgress = (calculatedDailySummary.totalCalories / profile.targetCalories) * 100;
	const proteinProgress = (calculatedDailySummary.totalProteinG / profile.targetProteinG) * 100;
	const carbsProgress = (calculatedDailySummary.totalCarbsG / profile.targetCarbsG) * 100;
	const fatProgress = (calculatedDailySummary.totalFatG / profile.targetFatG) * 100;

	const getProgressColor = (progress: number) => {
		if (progress >= 95 && progress <= 105) return "bg-green-500";
		if (progress >= 85 && progress <= 115) return "bg-yellow-500";
		return "bg-red-500";
	};

	const handleAddMeal = (mealType?: MealType) => {
		const mealTypeToUse = mealType || getMealTypeByTime();
		navigate({
			to: "/meal-tracker/add",
			search: { mealType: mealTypeToUse, date: selectedDate },
		});
	};

	const handleEditMeal = (mealId: string) => {
		navigate({
			to: "/meal-tracker/edit/$id",
			params: { id: mealId },
		});
	};

	const handlePreviousDay = () => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() - 1);
		const newDate = getLocalDateString(date);
		setSelectedDate(newDate);
	};

	const handleNextDay = () => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() + 1);
		const nextDate = getLocalDateString(date);
		if (nextDate <= today) {
			setSelectedDate(nextDate);
		}
	};

	const handleDateSelect = (newDate: Date | undefined) => {
		if (newDate) {
			const newDateString = getLocalDateString(newDate);
			if (newDateString <= today) {
				setSelectedDate(newDateString);
			}
		}
	};

	const formatDisplayDate = (dateString: string) => {
		const date = new Date(`${dateString}T00:00:00`);
		if (dateString === today) return "Today";
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		if (dateString === getLocalDateString(yesterday)) return "Yesterday";
		return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
	};

	return (
		<div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
			{/* Header with Hero Section */}
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl sm:text-3xl font-bold truncate">Meal Tracker</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							Track your daily nutrition and stay on target
						</p>
					</div>
					<Button
						onClick={() => handleAddMeal()}
						size="lg"
						className="w-full sm:w-auto shrink-0"
					>
						<Plus className="mr-2 h-4 w-4" />
						Log Meal
					</Button>
				</div>

				{/* Date Navigation */}
				<Card>
					<CardContent className="p-4">
						{/* Mobile Layout - Stacked */}
						<div className="flex flex-col sm:hidden gap-4">
							<div className="flex items-center justify-between gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={handlePreviousDay}
									className="shrink-0"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-auto px-3 py-2 flex-1 justify-center min-w-0"
										>
											<div className="flex items-center gap-2 min-w-0">
												<CalendarIcon className="h-4 w-4 shrink-0" />
												<span className="text-sm font-medium truncate">
													{formatDisplayDate(selectedDate)}
												</span>
											</div>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="center" side="bottom">
										<Calendar
											mode="single"
											selected={new Date(`${selectedDate}T00:00:00`)}
											onSelect={handleDateSelect}
											disabled={(date) => date > new Date(`${today}T23:59:59`)}
										/>
									</PopoverContent>
								</Popover>
								<Button
									variant="outline"
									size="icon"
									onClick={handleNextDay}
									disabled={isToday}
									className="shrink-0"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Desktop Layout - Horizontal */}
						<div className="hidden sm:flex items-center justify-between gap-4">
							<Button variant="outline" size="icon" onClick={handlePreviousDay}>
								<ChevronLeft className="h-4 w-4" />
							</Button>

							<div className="flex items-center gap-3 flex-1 justify-center min-w-0">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-auto px-3 py-2 min-w-0"
										>
											<div className="flex items-center gap-2">
												<CalendarIcon className="h-4 w-4 shrink-0" />
												<span className="text-sm font-semibold truncate">
													{formatDisplayDate(selectedDate)}
												</span>
											</div>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="center" side="bottom">
										<Calendar
											mode="single"
											selected={new Date(`${selectedDate}T00:00:00`)}
											onSelect={handleDateSelect}
											disabled={(date) => date > new Date(`${today}T23:59:59`)}
										/>
									</PopoverContent>
								</Popover>
							</div>

							<Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Stats Section - Calories and Macros */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Calorie Progress */}
				<Card className="p-4">
					<CardHeader className="pb-2 px-2">
						<CardTitle className="text-base sm:text-lg">Calories</CardTitle>
					</CardHeader>
					<CardContent className="px-2 py-2">
						<div className="flex items-center justify-center mb-2">
							<div className="relative w-48 h-48 sm:w-56 sm:h-56">
								<svg className="w-full h-full" viewBox="0 0 100 100">
									{/* Background circle */}
									<circle
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke="currentColor"
										strokeWidth="8"
										className="text-muted"
										opacity="0.2"
									/>
									{/* Progress circle */}
									<circle
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke="currentColor"
										strokeWidth="8"
										strokeLinecap="round"
										className={getProgressColor(calorieProgress).replace("bg-", "text-")}
										strokeDasharray={`${Math.min(calorieProgress, 100) * 2.51} 251.2`}
										transform="rotate(-90 50 50)"
									/>
								</svg>
								<div className="absolute inset-0 flex flex-col items-center justify-center">
									<Flame className="h-5 w-5 sm:h-6 sm:w-6 mb-1 text-orange-500" />
									<div className="text-xl font-bold">
										{Math.round(calculatedDailySummary.totalCalories)}
									</div>
									<div className="text-xs text-muted-foreground">of {profile.targetCalories}</div>
								</div>
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl font-bold mb-1">
								{profile.targetCalories - calculatedDailySummary.totalCalories > 0
									? Math.round(profile.targetCalories - calculatedDailySummary.totalCalories)
									: Math.round(calculatedDailySummary.totalCalories - profile.targetCalories)}
							</div>
							<div className="text-xs text-muted-foreground">
								{profile.targetCalories - calculatedDailySummary.totalCalories > 0
									? "kcal remaining"
									: "kcal over"}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Macros Card */}
				<Card className="p-4">
					<CardHeader className="pb-2">
						<CardTitle className="text-base sm:text-lg">Macros</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-6">
							{/* Protein */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Beef className="h-4 w-4 text-red-500" />
									<span className="text-sm font-medium">Protein</span>
								</div>
								<div className="space-y-1">
									<div className="flex items-baseline justify-between">
										<span className="text-xl font-bold">
											{Math.round(calculatedDailySummary.totalProteinG)}g
										</span>
										<span className="text-xs text-muted-foreground">
											/ {profile.targetProteinG}g
										</span>
									</div>
									<div
										className={cn(
											"relative h-2 w-full overflow-hidden rounded-full",
											proteinProgress > 105 ? "bg-red-500/20" : "bg-primary/20",
										)}
									>
										<div
											className={cn(
												"h-full w-full flex-1 transition-all",
												proteinProgress > 105 ? "bg-red-500" : "bg-primary",
											)}
											style={{ transform: `translateX(-${100 - Math.min(proteinProgress, 100)}%)` }}
										/>
									</div>
									<div className="text-xs text-muted-foreground text-center">
										{Math.round(proteinProgress)}%
									</div>
								</div>
							</div>

							{/* Carbs */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Wheat className="h-4 w-4 text-yellow-600" />
									<span className="text-sm font-medium">Carbs</span>
								</div>
								<div className="space-y-1">
									<div className="flex items-baseline justify-between">
										<span className="text-xl font-bold">
											{Math.round(calculatedDailySummary.totalCarbsG)}g
										</span>
										<span className="text-xs text-muted-foreground">/ {profile.targetCarbsG}g</span>
									</div>
									<div
										className={cn(
											"relative h-2 w-full overflow-hidden rounded-full",
											carbsProgress > 105 ? "bg-red-500/20" : "bg-primary/20",
										)}
									>
										<div
											className={cn(
												"h-full w-full flex-1 transition-all",
												carbsProgress > 105 ? "bg-red-500" : "bg-primary",
											)}
											style={{ transform: `translateX(-${100 - Math.min(carbsProgress, 100)}%)` }}
										/>
									</div>
									<div className="text-xs text-muted-foreground text-center">
										{Math.round(carbsProgress)}%
									</div>
								</div>
							</div>

							{/* Fat */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Droplets className="h-4 w-4 text-amber-700" />
									<span className="text-sm font-medium">Fat</span>
								</div>
								<div className="space-y-1">
									<div className="flex items-baseline justify-between">
										<span className="text-xl font-bold">
											{Math.round(calculatedDailySummary.totalFatG)}g
										</span>
										<span className="text-xs text-muted-foreground">/ {profile.targetFatG}g</span>
									</div>
									<div
										className={cn(
											"relative h-2 w-full overflow-hidden rounded-full",
											fatProgress > 105 ? "bg-red-500/20" : "bg-primary/20",
										)}
									>
										<div
											className={cn(
												"h-full w-full flex-1 transition-all",
												fatProgress > 105 ? "bg-red-500" : "bg-primary",
											)}
											style={{ transform: `translateX(-${100 - Math.min(fatProgress, 100)}%)` }}
										/>
									</div>
									<div className="text-xs text-muted-foreground text-center">
										{Math.round(fatProgress)}%
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Nutrition Trends Chart */}
			<TrendChart />

			{/* Favorites List */}
			<FavoritesList />

			{/* Meal List */}
			<MealList meals={meals} onEditMeal={handleEditMeal} />
		</div>
	);
}
