import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { z } from "zod";
import type { Trip } from "./types";
import { useCreateTrip, useUpdateTrip } from "@/hooks/trip-planner";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tripSchema = z.object({
	name: z.string().min(1, "Trip name is required").max(100, "Trip name must be less than 100 characters"),
	description: z.string().optional(),
	startDate: z.string().min(1, "Start date is required"),
	endDate: z.string().min(1, "End date is required"),
	isPublic: z.boolean().default(false),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
	message: "Start date must be before or equal to end date",
	path: ["endDate"],
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormProps {
	trip?: Trip;
	onSuccess?: (tripId?: string) => void;
	onCancel?: () => void;
}

export function TripForm({ trip, onSuccess, onCancel }: TripFormProps) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<TripFormData>({
		resolver: zodResolver(tripSchema) as any,
		defaultValues: {
			name: trip?.name || "",
			description: trip?.description || "",
			startDate: trip?.startDate ? new Date(trip.startDate).toISOString().split("T")[0] : "",
			endDate: trip?.endDate ? new Date(trip.endDate).toISOString().split("T")[0] : "",
			isPublic: trip?.isPublic || false,
		},
	});

	const { isDirty, isSubmitting: isFormSubmitting } = useFormState({ control: form.control });

	// Hooks
	const createTrip = useCreateTrip();
	const updateTrip = useUpdateTrip();

	const handleSubmit = async (data: TripFormData) => {
		try {
			setIsSubmitting(true);
			if (trip) {
				await updateTrip.mutateAsync({ id: trip.id, data });
				toast.success("Trip updated successfully");
				onSuccess?.(trip.id); // Pass ID if needed, or just void
			} else {
				const result = await createTrip.mutateAsync(data);
				toast.success("Trip created successfully");
				onSuccess?.(result.id);
				navigate({
					to: "/trip-planner/$id",
					params: { id: result.id },
				});
			}
		} catch (error) {
			console.error("Failed to save trip:", error);
			toast.error("Failed to save trip. Please try again.");
			// onError prop usage is tricky if signatures don't match, simplified here
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		if (isDirty) {
			if (confirm("Are you sure you want to discard your changes?")) {
				onCancel?.();
			}
		} else {
			onCancel?.();
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">
					{trip ? "Edit Trip" : "Create New Trip"}
				</h1>
			</div>

			<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
					{/* Trip Name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Trip Name *</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g., Summer Vacation in Japan"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Description */}
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Describe your trip..."
										rows={3}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Date Range */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Start Date *</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-start text-left font-normal",
														!field.value && "text-muted-foreground",
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value
														? format(new Date(field.value), "PPP")
														: "Pick a date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value ? new Date(field.value) : undefined}
													onSelect={(date) => {
														if (date) {
															field.onChange(date.toISOString().split("T")[0]);
														}
													}}
													disabled={(date) => date < new Date()}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>End Date *</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-start text-left font-normal",
														!field.value && "text-muted-foreground",
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value
														? format(new Date(field.value), "PPP")
														: "Pick a date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value ? new Date(field.value) : undefined}
													onSelect={(date) => {
														if (date) {
															field.onChange(date.toISOString().split("T")[0]);
														}
													}}
													disabled={(date) => date < new Date()}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Public Sharing */}
					<FormField
						control={form.control}
						name="isPublic"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								FormControl
								<FormLabel className="font-normal">
									<div className="flex flex-col space-y-1 leading-none">
										<span>Share Trip Publicly</span>
										<span className="text-sm text-muted-foreground">
											Allow others to view your trip details
										</span>
									</div>
								</FormLabel>
								<FormControl>
									<input
										type="checkbox"
										checked={field.value}
										onChange={field.onChange}
										className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3 pt-4">
						<Button
							type="submit"
							className="w-full sm:w-auto"
							disabled={isFormSubmitting || isSubmitting}
						>
							{(isFormSubmitting || isSubmitting) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{trip ? "Update Trip" : "Create Trip"}
						</Button>

						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								className="w-full sm:w-auto"
								disabled={isFormSubmitting}
							>
								Cancel
							</Button>
						)}
					</div>
				</form>
			</Form>
		</div>
	);
}