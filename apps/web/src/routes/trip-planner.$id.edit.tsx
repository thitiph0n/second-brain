import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "../auth/components/AuthGuard";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useTrip, useUpdateTrip, useDeleteTrip } from "@/hooks/trip-planner";
import { LoadingCard } from "@/components/LoadingSpinner";
import type { UpdateTripRequest } from "@/types/trip-planner";
import { useEffect } from "react";

export const Route = createFileRoute("/trip-planner/$id/edit")({
	component: EditTripPage,
});

function EditTripPage() {
	return (
		<RequireAuth>
			<EditTripPageContent />
		</RequireAuth>
	);
}

function EditTripPageContent() {
	const navigate = useNavigate();
	const params = useParams({ from: "/trip-planner/$id/edit" });
	const tripId = params.id;

	const { data: trip, isLoading, isError } = useTrip(tripId);
	const { mutateAsync: updateTrip, isPending: isUpdating } = useUpdateTrip();
	const { mutateAsync: deleteTrip, isPending: isDeleting } = useDeleteTrip();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<UpdateTripRequest>();

	// Populate form with existing data
	useEffect(() => {
		if (trip) {
			reset({
				name: trip.name,
				description: trip.description || "",
				startDate: trip.startDate,
				endDate: trip.endDate,
				coverImage: trip.coverImageUrl || "",
			});
		}
	}, [trip, reset]);

	const onSubmit = async (data: UpdateTripRequest) => {
		try {
			// Clean up the data - convert empty strings to null for optional fields
			const cleanedData: UpdateTripRequest = {
				...data,
				description: data.description?.trim() || null,
				coverImage: data.coverImage?.trim() || null,
			};
			
			await updateTrip({ id: tripId, data: cleanedData });
			navigate({ to: `/trip-planner/${tripId}` });
		} catch (error) {
			console.error("Failed to update trip:", error);
		}
	};

	const handleCancel = () => {
		navigate({ to: `/trip-planner/${tripId}` });
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
			return;
		}

		try {
			await deleteTrip(tripId);
			navigate({ to: "/trip-planner", search: { status: "upcoming" } });
		} catch (error) {
			console.error("Failed to delete trip:", error);
		}
	};

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "upcoming":
				return "default";
			case "ongoing":
				return "secondary";
			case "past":
				return "outline";
			default:
				return "outline";
		}
	};

	if (isLoading) {
		return <LoadingCard lines={10} />;
	}

	if (isError || !trip) {
		return (
			<div className="text-center py-8">
				<p className="text-destructive">Failed to load trip. Please try again.</p>
				<Button onClick={() => navigate({ to: "/trip-planner", search: { status: "upcoming" } })} className="mt-4">
					Back to Trips
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl font-bold">Edit Trip</h1>
						<p className="text-muted-foreground">Update {trip.name} details</p>
					</div>
					<Badge variant={getStatusVariant(trip.status)}>
						{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
					</Badge>
				</div>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={handleDelete}
					disabled={isDeleting}
				>
					<Trash2 className="h-4 w-4 mr-2" />
					{isDeleting ? "Deleting..." : "Delete Trip"}
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Basic Information */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Trip Name</Label>
							<Input id="name" {...register("name")} />
							{errors.name && (
								<p className="text-sm text-destructive">{errors.name.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea id="description" {...register("description")} />
						</div>
					</CardContent>
				</Card>

				{/* Dates */}
				<Card>
					<CardHeader>
						<CardTitle>Dates</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input id="startDate" type="date" {...register("startDate")} />
							{errors.startDate && (
								<p className="text-sm text-destructive">{errors.startDate.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">End Date</Label>
							<Input id="endDate" type="date" {...register("endDate")} />
							{errors.endDate && (
								<p className="text-sm text-destructive">{errors.endDate.message}</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Cover Image */}
				<Card>
					<CardHeader>
						<CardTitle>Cover Image (Optional)</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="coverImage">Image URL</Label>
							<Input
								id="coverImage"
								type="url"
								placeholder="https://example.com/image.jpg"
								{...register("coverImage")}
							/>
							<p className="text-xs text-muted-foreground">
								Provide a URL to an image for this trip
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-4 pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={handleCancel}
					disabled={isUpdating}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isUpdating}>
					<Save className="h-4 w-4 mr-2" />
					{isUpdating ? "Saving..." : "Save Changes"}
				</Button>
			</div>
		</form>
	);
}