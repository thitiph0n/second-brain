import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Star } from "lucide-react";

import { useCreateItineraryItem, useUpdateItineraryItem, useUploadItineraryImage } from "@/hooks/trip-planner";
import type { CreateItineraryItemRequest, UpdateItineraryItemRequest } from "@/types/trip-planner";

import { LocationPicker } from "./LocationPicker";
import { ImageUploader } from "./ImageUploader";
import type { ItineraryItem, ItineraryImage } from "./types";

const itineraryItemSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
	description: z.string().optional(),
	location: z.object({
		address: z.string().optional(),
		city: z.string().optional(),
		country: z.string().optional(),
		coordinates: z.object({
			latitude: z.number(),
			longitude: z.number(),
		}).optional(),
	}).optional(),
	notes: z.string().optional(),
	category: z.enum([
		"accommodation",
		"transportation",
		"activity",
		"dining",
		"shopping",
		"attraction",
		"rest",
		"other",
	]),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	estimatedDuration: z.number().min(1).optional(),
	isRequired: z.boolean(),
});

type ItineraryFormData = z.infer<typeof itineraryItemSchema>;

interface ItineraryFormProps {
	tripId: string;
	dayNumber: number;
	item?: ItineraryItem;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function ItineraryForm({ tripId, dayNumber, item, onSuccess, onCancel }: ItineraryFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [images, setImages] = useState<ItineraryImage[]>(item?.images || []);
	
	const uploadImage = useUploadItineraryImage();


	const form = useForm<ItineraryFormData>({
		resolver: zodResolver(itineraryItemSchema),
		defaultValues: {
			title: item?.title || "",
			description: item?.description || "",
			location: item?.location || undefined,
			notes: item?.notes || "",
			category: item?.category || "other",
			startTime: item?.startTime || "",
			endTime: item?.endTime || "",
			estimatedDuration: item?.estimatedDuration || 60,
			isRequired: item?.isRequired ?? false,
		},
	});

	const createItem = useCreateItineraryItem();

	const updateItem = useUpdateItineraryItem();

	const handleSubmit = async (data: ItineraryFormData) => {
		setIsSubmitting(true);

		try {
			// Map component data structure to API request structure
			const apiData: CreateItineraryItemRequest = {
				placeName: data.title,
				dayNumber,
				time: data.startTime || null,
				locationAddress: data.location?.address || null,
				locationLat: data.location?.coordinates?.latitude,
				locationLng: data.location?.coordinates?.longitude,
				notes: data.notes || null,
				sortOrder: item?.order || 0,
			};

			const updateApiData: UpdateItineraryItemRequest = {
				placeName: data.title,
				time: data.startTime || null,
				locationAddress: data.location?.address || null,
				locationLat: data.location?.coordinates?.latitude,
				locationLng: data.location?.coordinates?.longitude,
				notes: data.notes || null,
				sortOrder: item?.order,
				dayNumber,
			};

			let resultItemId = item?.id;

			if (item) {
				await updateItem.mutateAsync({
					tripId,
					itemId: item.id,
					data: updateApiData
				});
			} else {
				const newItem = await createItem.mutateAsync({
					tripId,
					data: apiData
				});
				resultItemId = newItem.id;
			}
			
			// Upload pending images
			if (resultItemId) {
				const pendingImages = images.filter(img => img.file);
				if (pendingImages.length > 0) {
					await Promise.all(pendingImages.map(img =>
						uploadImage.mutateAsync({
							tripId,
							itemId: resultItemId!,
							file: img.file!,
							caption: img.altText
						})
					));
				}
				toast.success(item ? "Itinerary item updated successfully!" : "Itinerary item added successfully!");
				onSuccess?.();
			}
		} catch (error) {
			// Error is handled by the mutation hook
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		if (confirm("Are you sure you want to discard your changes?")) {
			onCancel?.();
		}
	};

	const categoryOptions = [
		{ value: "accommodation", label: "Accommodation", icon: "🏨" },
		{ value: "transportation", label: "Transportation", icon: "🚗" },
		{ value: "activity", label: "Activity", icon: "🎯" },
		{ value: "dining", label: "Dining", icon: "🍽️" },
		{ value: "shopping", label: "Shopping", icon: "🛍️" },
		{ value: "attraction", label: "Attraction", icon: "🏛️" },
		{ value: "rest", label: "Rest", icon: "😴" },
		{ value: "other", label: "Other", icon: "📝" },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">
					{item ? "Edit Itinerary Item" : "Add New Itinerary Item"}
				</h1>
				<div className="text-sm text-muted-foreground">
					Day {dayNumber}
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
					{/* Title */}
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title *</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g., Visit Eiffel Tower"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Category */}
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Category *</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{categoryOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<div className="flex items-center gap-2">
													<span className="text-lg">{option.icon}</span>
													<span>{option.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
										placeholder="Add details about this activity..."
										rows={3}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Location */}
					<FormField
						control={form.control}
						name="location"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Location</FormLabel>
								<FormControl>
									<LocationPicker
										value={field.value}
										onChange={(location) => field.onChange(location)}
										onClear={() => field.onChange(undefined)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					 {/* Time and Duration */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<FormField
							control={form.control}
							name="startTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Start Time</FormLabel>
									<FormControl>
										<Input
											type="time"
											{...field}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endTime"
							render={({ field }) => (
								<FormItem>
									<FormLabel>End Time</FormLabel>
									<FormControl>
										<Input
											type="time"
											{...field}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="estimatedDuration"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Duration (minutes)</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="1"
											placeholder="60"
											{...field}
											onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
											value={field.value || ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Required */}
					<FormField
						control={form.control}
						name="isRequired"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								FormControl
								<FormLabel className="font-normal">
									<div className="flex flex-col space-y-1 leading-none">
										<div className="flex items-center gap-2">
											<Star className="h-4 w-4 text-yellow-500" />
											<span>Required Activity</span>
										</div>
										<span className="text-sm text-muted-foreground">
											This activity is essential for your trip
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

					{/* Notes */}
					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Notes</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Add any additional notes or reminders..."
										rows={3}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Images */}
					<div className="space-y-2">
						<FormLabel>Photos</FormLabel>
						<ImageUploader 
							value={images} 
							onChange={setImages}
							maxFiles={5}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3 pt-4">
						<Button
							type="submit"
							className="w-full sm:w-auto"
							disabled={isSubmitting}
						>
							{(isSubmitting || createItem.isPending || updateItem.isPending) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{item ? "Update Item" : "Add Item"}
						</Button>

						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								className="w-full sm:w-auto"
								disabled={isSubmitting}
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