import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MealType } from "@/types/meal-tracker";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get local date in YYYY-MM-DD format.
 * This ensures consistent date handling across the application regardless of timezone.
 * @param date - Date to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
	const offset = date.getTimezoneOffset() * 60000;
	const localDate = new Date(date.getTime() - offset);
	return localDate.toISOString().split("T")[0];
}

/**
 * Get meal type based on current local time.
 * @returns MealType based on time of day:
 *   - 7:00-10:00: Breakfast
 *   - 11:00-14:00: Lunch
 *   - 15:00-17:00: Snack
 *   - 18:00-21:00: Dinner
 *   - Other times: Snack
 */
export function getMealTypeByTime(): MealType {
	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const timeInMinutes = hours * 60 + minutes;

	// 7:00-10:00 (420-600 minutes) - Breakfast
	if (timeInMinutes >= 420 && timeInMinutes <= 600) {
		return "breakfast";
	}

	// 11:00-14:00 (660-840 minutes) - Lunch
	if (timeInMinutes >= 660 && timeInMinutes <= 840) {
		return "lunch";
	}

	// 15:00-17:00 (900-1020 minutes) - Snack
	if (timeInMinutes >= 900 && timeInMinutes <= 1020) {
		return "snack";
	}

	// 18:00-21:00 (1080-1260 minutes) - Dinner
	if (timeInMinutes >= 1080 && timeInMinutes <= 1260) {
		return "dinner";
	}

	// All other times - Snack
	return "snack";
}
