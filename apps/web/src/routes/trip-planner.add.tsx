import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "../auth/components/AuthGuard";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useCreateTrip } from "@/hooks/trip-planner";
import type { CreateTripRequest } from "@/types/trip-planner";

export const Route = createFileRoute("/trip-planner/add")({
	component: AddTripPage,
});

function AddTripPage() {
	return (
		<RequireAuth>
			<AddTripPageContent />
		</RequireAuth>
	);
}

function AddTripPageContent() {
	const navigate = useNavigate();
	const { mutateAsync: createTrip, isPending } = useCreateTrip();
	
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateTripRequest>();

	const onSubmit = async (data: CreateTripRequest) => {
		try {
			const cleanedData: CreateTripRequest = {
				...data,
				description: data.description?.trim() || null,
				coverImage: data.coverImage?.trim() || null,
			};

			const response = await createTrip(cleanedData);
			navigate({ to: `/trip-planner/${response.trip.id}` });
		} catch (error) {
			console.error("Failed to create trip:", error);
		}
	};

	const handleCancel = () => {
		navigate({ to: "/trip-planner", search: { status: "upcoming" } });
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-bold">Plan New Trip</h1>
					<p className="text-muted-foreground">Create your next adventure</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Basic Information */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">
								Trip Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="Paris Adventure"
								{...register("name", { required: "Trip name is required" })}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">{errors.name.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Describe your trip..."
								{...register("description")}
							/>
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
							<Label htmlFor="startDate">
								Start Date <span className="text-destructive">*</span>
							</Label>
							<Input
								id="startDate"
								type="date"
								{...register("startDate", { required: "Start date is required" })}
							/>
							{errors.startDate && (
								<p className="text-sm text-destructive">{errors.startDate.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">
								End Date <span className="text-destructive">*</span>
							</Label>
							<Input
								id="endDate"
								type="date"
								{...register("endDate", { required: "End date is required" })}
							/>
							{errors.endDate && (
								<p className="text-sm text-destructive">{errors.endDate.message}</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Cover Image (Optional) */}
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
				<Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button type="submit" disabled={isPending}>
					<Save className="h-4 w-4 mr-2" />
					{isPending ? "Creating..." : "Create Trip"}
				</Button>
			</div>
		</form>
	);
}