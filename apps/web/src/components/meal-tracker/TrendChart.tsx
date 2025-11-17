import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTrendsAnalytics, useUserProfile } from "@/hooks/meal-tracker";
import {
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Line,
	ComposedChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeFrame = "7d" | "14d" | "30d" | "90d";

const TIMEFRAME_OPTIONS: { label: string; value: TimeFrame; days: number }[] = [
	{ label: "7 days", value: "7d", days: 7 },
	{ label: "14 days", value: "14d", days: 14 },
	{ label: "30 days", value: "30d", days: 30 },
	{ label: "90 days", value: "90d", days: 90 },
];

export function TrendChart() {
	const [timeframe, setTimeframe] = useState<TimeFrame>("7d");
	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [isCustomRange, setIsCustomRange] = useState(false);

	const { data: trendsData, isLoading } = useTrendsAnalytics(isCustomRange ? undefined : timeframe);
	const { data: profile } = useUserProfile();

	const trends = trendsData?.trends;

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	const chartData =
		trends?.nutrition.dailyBreakdown.map((day) => ({
			date: formatDate(day.date),
			// Convert macros to calories for stacking
			proteinCal: Math.round(day.totalProteinG * 4), // 4 cal per g
			carbsCal: Math.round(day.totalCarbsG * 4), // 4 cal per g
			fatCal: Math.round(day.totalFatG * 9), // 9 cal per g
			// Keep original values for tooltip
			protein: Math.round(day.totalProteinG),
			carbs: Math.round(day.totalCarbsG),
			fat: Math.round(day.totalFatG),
			totalCalories: Math.round(day.totalCalories),
			target: profile?.targetCalories || 0,
		})) || [];

	const getTrendIcon = (trend: "increasing" | "decreasing" | "stable") => {
		switch (trend) {
			case "increasing":
				return <TrendingUp className="h-4 w-4 text-green-500" />;
			case "decreasing":
				return <TrendingDown className="h-4 w-4 text-red-500" />;
			case "stable":
				return <Minus className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const CustomTooltip = ({ active, payload }: any) => {
		if (!active || !payload || !payload.length) return null;

		const data = payload[0].payload;
		return (
			<div className="bg-background border border-border rounded-lg p-3 shadow-lg">
				<p className="font-semibold mb-2">{data.date}</p>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between gap-4">
						<span className="font-medium">Total:</span>
						<span className="font-bold">{data.totalCalories} cal</span>
					</div>
					<div className="flex justify-between gap-4">
						<span className="flex items-center gap-1">
							<span className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
							Protein:
						</span>
						<span>
							{data.protein}g ({data.proteinCal} cal)
						</span>
					</div>
					<div className="flex justify-between gap-4">
						<span className="flex items-center gap-1">
							<span className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
							Carbs:
						</span>
						<span>
							{data.carbs}g ({data.carbsCal} cal)
						</span>
					</div>
					<div className="flex justify-between gap-4">
						<span className="flex items-center gap-1">
							<span className="w-3 h-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
							Fat:
						</span>
						<span>
							{data.fat}g ({data.fatCal} cal)
						</span>
					</div>
					{data.target > 0 && (
						<div className="flex justify-between gap-4 pt-1 border-t border-border mt-1">
							<span className="text-muted-foreground">Target:</span>
							<span className="text-muted-foreground">{data.target} cal</span>
						</div>
					)}
				</div>
			</div>
		);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-base sm:text-lg">Nutrition Trends</CardTitle>
						<div className="flex gap-1 sm:gap-2">
							{TIMEFRAME_OPTIONS.map((option) => (
								<Skeleton key={option.value} className="h-8 w-12 sm:w-16" />
							))}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
					<div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-16" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!trends || chartData.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base sm:text-lg">Nutrition Trends</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64 text-muted-foreground">
						No data available for the selected timeframe
					</div>
				</CardContent>
			</Card>
		);
	}

	const handleQuickSelect = (value: TimeFrame) => {
		setTimeframe(value);
		setIsCustomRange(false);
		setDateRange(undefined);
	};

	const handleDateRangeSelect = (range: DateRange | undefined) => {
		setDateRange(range);
		if (range?.from && range?.to) {
			setIsCustomRange(true);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<CardTitle className="text-base sm:text-lg">Nutrition Trends</CardTitle>
					<div className="flex gap-2 flex-wrap items-center">
						{TIMEFRAME_OPTIONS.map((option) => (
							<Button
								key={option.value}
								variant={!isCustomRange && timeframe === option.value ? "default" : "outline"}
								size="sm"
								onClick={() => handleQuickSelect(option.value)}
								className="text-xs sm:text-sm"
							>
								{option.label}
							</Button>
						))}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={isCustomRange ? "default" : "outline"}
									size="sm"
									className={cn(
										"text-xs sm:text-sm justify-start text-left font-normal",
										!dateRange && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange?.from ? (
										dateRange.to ? (
											<>
												{format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
											</>
										) : (
											format(dateRange.from, "MMM d, yyyy")
										)
									) : (
										<span>Custom</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<Calendar
									mode="range"
									selected={dateRange}
									onSelect={handleDateRangeSelect}
									numberOfMonths={2}
									disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="h-64 sm:h-80">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
							<YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
							<Tooltip content={<CustomTooltip />} />
							<Legend wrapperStyle={{ fontSize: "12px" }} />
							<Bar dataKey="proteinCal" stackId="macros" fill="#ef4444" name="Protein" />
							<Bar dataKey="carbsCal" stackId="macros" fill="#f59e0b" name="Carbs" />
							<Bar
								dataKey="fatCal"
								stackId="macros"
								fill="#8b5cf6"
								name="Fat"
								radius={[4, 4, 0, 0]}
							/>
							<Line
								type="monotone"
								dataKey="target"
								stroke="hsl(var(--muted-foreground))"
								strokeWidth={2}
								strokeDasharray="5 5"
								name="Target"
								dot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>

				{/* Stats Summary */}
				<div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Avg Calories</p>
						<p className="text-xl font-bold">{Math.round(trends.nutrition.averageCalories)}</p>
						<div className="flex items-center gap-1">
							{getTrendIcon(trends.weeklyTrends.trends.calorieTrend)}
							<span className="text-xs text-muted-foreground capitalize">
								{trends.weeklyTrends.trends.calorieTrend}
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Avg Protein</p>
						<p className="text-xl font-bold">
							{Math.round(trends.nutrition.totalProtein / trends.nutrition.dailyBreakdown.length)}g
						</p>
						<div className="flex items-center gap-1">
							{getTrendIcon(trends.weeklyTrends.trends.proteinTrend)}
							<span className="text-xs text-muted-foreground capitalize">
								{trends.weeklyTrends.trends.proteinTrend}
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Goal Achievement</p>
						<p className="text-xl font-bold">{Math.round(trends.nutrition.goalAchievementRate)}%</p>
						<p className="text-xs text-muted-foreground">Within ±200 cal</p>
					</div>

					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Consistency</p>
						<p className="text-xl font-bold">
							{Math.round(trends.weeklyTrends.trends.consistencyScore)}%
						</p>
						<p className="text-xs text-muted-foreground">Tracking score</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
