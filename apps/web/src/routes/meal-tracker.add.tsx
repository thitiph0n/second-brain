import { createFileRoute } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MealForm } from "@/components/meal-tracker/MealForm";
import { RequireAuth } from "../auth/components/AuthGuard";
import type { MealType } from "@/types/meal-tracker";
import { useNavigate, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/meal-tracker/add")({
	component: AddMealPage,
	validateSearch: (search: Record<string, unknown>) => ({
		mealType: (search.mealType as string) || "breakfast",
		date: (search.date as string) || undefined,
	}),
});

function AddMealPage() {
	return (
		<RequireAuth>
			<AddMealPageContent />
		</RequireAuth>
	);
}

function AddMealPageContent() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/meal-tracker/add" });

	const handleClose = () => {
		navigate({ to: "/meal-tracker" });
	};

	return (
		<div className="min-h-screen w-full overflow-x-hidden">
			<div className="w-full px-4 py-6 space-y-6">
				{/* Header */}
				<div className="flex items-center gap-2 w-full">
					<Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="min-w-0 flex-1">
						<h1 className="text-xl font-bold truncate">Log Meal</h1>
						<p className="text-muted-foreground text-sm">Add a new meal to your tracker</p>
					</div>
				</div>

				{/* Form - Simple wrapper without card for mobile */}
				<div className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
					<MealForm
						mealType={search.mealType as MealType}
						date={search.date}
						onClose={handleClose}
						isStandalone={true}
					/>
				</div>
			</div>
		</div>
	);
}
