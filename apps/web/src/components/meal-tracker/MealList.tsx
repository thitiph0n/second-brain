import { useMemo, useState } from "react";
import { useDeleteMeal, useCreateFavorite } from "@/hooks/meal-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Coffee, Sun, Moon, Apple, Loader2, Star, Beef, Wheat, Droplets } from "lucide-react";
import { toast } from "sonner";
import type { Meal, MealType } from "@/types/meal-tracker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface MealListProps {
	meals: Meal[];
	onEditMeal: (mealId: string) => void;
}

const mealTypeConfig = {
	breakfast: {
		icon: Coffee,
		label: "Breakfast",
		color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
	},
	lunch: {
		icon: Sun,
		label: "Lunch",
		color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
	},
	dinner: {
		icon: Moon,
		label: "Dinner",
		color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	},
	snack: {
		icon: Apple,
		label: "Snack",
		color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	},
};

export function MealList({ meals, onEditMeal }: MealListProps) {
	const deleteMeal = useDeleteMeal();
	const createFavorite = useCreateFavorite();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [mealToDelete, setMealToDelete] = useState<{ id: string; name: string } | null>(null);

	// Get today's meals grouped by meal type
	const todayMeals = useMemo(() => {
		// Group by meal type
		const grouped: Record<MealType, Meal[]> = {
			breakfast: [],
			lunch: [],
			dinner: [],
			snack: [],
		};

		meals.forEach((meal: Meal) => {
			grouped[meal.mealType as MealType].push(meal);
		});

		return grouped;
	}, [meals]);

	const handleDeleteClick = (mealId: string, foodName: string) => {
		setMealToDelete({ id: mealId, name: foodName });
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!mealToDelete) return;

		try {
			await deleteMeal.mutateAsync(mealToDelete.id);
			setDeleteDialogOpen(false);
			setMealToDelete(null);
		} catch (error) {
			// Error is handled by the mutation hook
		}
	};

	const handleAddToFavorites = async (meal: Meal) => {
		try {
			const favoriteData = {
				foodName: meal.foodName,
				calories: meal.calories,
				proteinG: meal.proteinG || 0,
				carbsG: meal.carbsG || 0,
				fatG: meal.fatG || 0,
				servingSize: meal.servingSize,
				servingUnit: meal.servingUnit,
			};

			await createFavorite.mutateAsync(favoriteData);
			toast.success(`"${meal.foodName}" added to favorites!`);
		} catch (error) {
			// Error is handled by the mutation hook
		}
	};

	const totalMeals = Object.values(todayMeals).flat().length;
	const isLoading = deleteMeal.isPending;

	if (totalMeals === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Meals</CardTitle>
					<CardDescription>No meals logged for this date</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<p>Start logging your first meal to track your nutrition!</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Meals</CardTitle>
				<CardDescription>
					{totalMeals} meal{totalMeals !== 1 ? "s" : ""} logged
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mealType) => {
					const mealsForType = todayMeals[mealType];
					if (mealsForType.length === 0) return null;

					const config = mealTypeConfig[mealType];
					const Icon = config.icon;

					return (
						<div key={mealType} className="space-y-3">
							<div className="flex items-center gap-2">
								<Icon className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-semibold capitalize">{config.label}</h3>
								<Badge variant="secondary" className="ml-auto">
									{mealsForType.length}
								</Badge>
							</div>

							<div className="space-y-2">
								{mealsForType.map((meal) => (
									<div
										key={meal.id}
										className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
									>
										<div className="flex-1 min-w-0 space-y-2">
											<div className="flex items-center justify-between gap-3">
												<h4 className="font-medium text-base">{meal.foodName}</h4>
												<span className="text-base font-semibold whitespace-nowrap">
													{meal.calories} kcal
												</span>
											</div>

											<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
												{meal.proteinG > 0 && (
													<div className="flex items-center gap-1">
														<Beef className="h-3.5 w-3.5 text-red-500" />
														<span>{Math.round(meal.proteinG)}g</span>
													</div>
												)}
												{meal.carbsG > 0 && (
													<div className="flex items-center gap-1">
														<Wheat className="h-3.5 w-3.5 text-yellow-600" />
														<span>{Math.round(meal.carbsG)}g</span>
													</div>
												)}
												{meal.fatG > 0 && (
													<div className="flex items-center gap-1">
														<Droplets className="h-3.5 w-3.5 text-amber-700" />
														<span>{Math.round(meal.fatG)}g</span>
													</div>
												)}
												{meal.servingSize && (
													<span className="ml-2">
														{meal.servingSize}
														{meal.servingUnit ? ` ${meal.servingUnit}` : ""}
													</span>
												)}
											</div>

											{meal.notes && (
											<p className="text-sm text-muted-foreground italic line-clamp-2">
												{meal.notes}
											</p>
										)}
										</div>

										<div className="flex flex-col gap-1 self-center">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleAddToFavorites(meal)}
												disabled={createFavorite.isPending}
												className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
												title="Add to favorites"
											>
												<Star className="h-3.5 w-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onEditMeal(meal.id)}
												className="h-8 w-8"
												title="Edit meal"
											>
												<Edit className="h-3.5 w-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDeleteClick(meal.id, meal.foodName)}
												disabled={isLoading}
												className="h-8 w-8 text-destructive hover:text-destructive"
												title="Delete meal"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</CardContent>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Meal</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &quot;{mealToDelete?.name}&quot;? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
