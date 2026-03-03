import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMeals, useCreateMeal, useUpdateMeal, useCreateFavorite } from "@/hooks/meal-tracker";
import { mealTrackerOptimistic } from "@/hooks/meal-tracker";
import { getMealTypeByTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Save,
	Star,
	Sparkles,
	X,
	Camera,
	Calendar as CalendarIcon,
	ChevronDown,
	ChevronUp,
	Wand2,
	ImagePlus,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import type { MealType, MealFormData, FavoriteFood, ConfidenceLevel } from "@/types/meal-tracker";
import { MEAL_TYPES } from "@/types/meal-tracker";
import { toast } from "sonner";
import { mealTrackerAPI } from "@/api/meal-tracker";
import { cn } from "@/lib/utils";
import libheif from "libheif-js";

interface MealFormProps {
	mealType?: MealType;
	date?: string;
	editingMealId?: string | null;
	onClose: () => void;
	isStandalone?: boolean;
}

// Nutrition fields configuration (moved outside component to avoid recreation on each render)
const NUTRITION_FIELDS = [
	{ id: "calories", label: "Calories (kcal) *", field: "calories" as const, step: "1", required: true },
	{ id: "protein", label: "Protein (g)", field: "proteinG" as const, step: "0.1", required: false },
	{ id: "carbs", label: "Carbs (g)", field: "carbsG" as const, step: "0.1", required: false },
	{ id: "fat", label: "Fat (g)", field: "fatG" as const, step: "0.1", required: false },
] as const;

export function MealForm({
	mealType,
	date,
	editingMealId,
	onClose,
	isStandalone = false,
}: MealFormProps) {
	const resolvedMealType = mealType || getMealTypeByTime();
	const queryClient = useQueryClient();
	const { data: mealsData } = useMeals();
	const createMeal = useCreateMeal();
	const updateMeal = useUpdateMeal();
	const createFavorite = useCreateFavorite();

	const editingMeal =
		editingMealId && mealsData?.meals ? mealsData.meals.find((m) => m.id === editingMealId) : null;

	const getLocalDateString = (date: Date = new Date()) => {
		const offset = date.getTimezoneOffset() * 60000;
		const localDate = new Date(date.getTime() - offset);
		return localDate.toISOString().split("T")[0];
	};

	const [formData, setFormData] = useState<MealFormData>({
		mealType: editingMeal?.mealType || resolvedMealType,
		foodName: editingMeal?.foodName || "",
		calories: editingMeal?.calories || 0,
		proteinG: editingMeal?.proteinG || 0,
		carbsG: editingMeal?.carbsG || 0,
		fatG: editingMeal?.fatG || 0,
		servingSize: editingMeal?.servingSize || "",
		servingUnit: editingMeal?.servingUnit || "",
		notes: editingMeal?.notes || "",
		loggedAt: editingMeal?.loggedAt
			? editingMeal.loggedAt.split("T")[0]
			: date || getLocalDateString(),
	});

	// AI input state
	const [aiText, setAiText] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isParsing, setIsParsing] = useState(false);

	// Consolidated AI result state
	const [aiState, setAiState] = useState<{
		confidence: ConfidenceLevel | null;
		reasoning: string | null;
		showDetails: boolean;
		hasResult: boolean;
	}>({
		confidence: null,
		reasoning: null,
		showDetails: !!editingMealId,
		hasResult: false,
	});

	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileReaderRef = useRef<FileReader | null>(null);

	// Cleanup FileReader on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			if (fileReaderRef.current) {
				fileReaderRef.current.abort();
			}
		};
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const now = new Date();
			const selectedDate = formData.loggedAt || now.toISOString().split("T")[0];
			const todayDate = now.toISOString().split("T")[0];

			let loggedAtISO: string;
			if (selectedDate === todayDate) {
				loggedAtISO = now.toISOString();
			} else {
				loggedAtISO = new Date(selectedDate + "T12:00:00.000Z").toISOString();
			}

			const submissionData = { ...formData, loggedAt: loggedAtISO };

			if (editingMealId) {
				await updateMeal.mutateAsync({ id: editingMealId, data: submissionData });
				toast.success("Meal updated successfully!");
			} else {
				await createMeal.mutateAsync(submissionData);
				toast.success("Meal logged successfully!");
			}
			onClose();
		} catch (_error) {
			// Error is handled by the mutation hook
		}
	};

	const handleSaveAsFavorite = async () => {
		if (!formData.foodName || !formData.calories) {
			toast.error("Please enter food name and calories first");
			return;
		}

		try {
			const favoriteData = {
				foodName: formData.foodName,
				calories: formData.calories,
				proteinG: formData.proteinG || 0,
				carbsG: formData.carbsG || 0,
				fatG: formData.fatG || 0,
				servingSize: formData.servingSize,
				servingUnit: formData.servingUnit,
			};

			const newFavorite: FavoriteFood = {
				...favoriteData,
				id: `fav-${Date.now()}`,
				userId: "current-user-id",
				usageCount: 0,
				lastUsedAt: undefined,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			mealTrackerOptimistic.optimisticAddFavorite(queryClient, newFavorite);
			await createFavorite.mutateAsync(favoriteData);
			toast.success("Added to favorites!");
		} catch (_error) {
			// Error is handled by the mutation hook
		}
	};

	const isSubmitting = createMeal.isPending || updateMeal.isPending;

	const handleChange = (field: keyof MealFormData, value: string | number) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// ─── Image handling ──────────────────────────────────────────────────────────
	const compressImage = async (file: File): Promise<File> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (event) => {
				const img = new Image();
				img.src = event.target?.result as string;
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let { width, height } = img;
					const MAX = 1024;
					if (width > height) {
						if (width > MAX) { height *= MAX / width; width = MAX; }
					} else {
						if (height > MAX) { width *= MAX / height; height = MAX; }
					}
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					ctx?.drawImage(img, 0, 0, width, height);
					canvas.toBlob(
						(blob) => {
							if (blob) {
								resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
							} else {
								reject(new Error("Compression failed"));
							}
						},
						"image/jpeg",
						0.8,
					);
				};
				img.onerror = reject;
			};
			reader.onerror = reject;
		});
	};

	const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const fileName = file.name.toLowerCase();
		const isHeic =
			file.type === "image/heic" ||
			file.type === "image/heif" ||
			fileName.endsWith(".heic") ||
			fileName.endsWith(".heif");

		if (!file.type.startsWith("image/") && !isHeic) {
			toast.error("Please select an image file");
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image too large. Please use an image smaller than 10MB.");
			return;
		}

		try {
			let processedFile = file;

			if (isHeic) {
				toast.info("Converting HEIC to JPEG…", { duration: 2000 });
				try {
					const arrayBuffer = await file.arrayBuffer();
					const decoder = new libheif.HeifDecoder();
					const data = decoder.decode(arrayBuffer);
					if (!data || data.length === 0) throw new Error("No image data decoded");
					const image = data[0];
					const width = image.get_width();
					const height = image.get_height();
					const canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					if (!ctx) throw new Error("Failed to get canvas context");
					const imageData = ctx.createImageData(width, height);
					await new Promise<void>((resolve, reject) => {
						image.display(imageData, (displayData: ImageData | null) => {
							if (!displayData) { reject(new Error("Failed to decode")); return; }
							resolve();
						});
					});
					ctx.putImageData(imageData, 0, 0);
					const blob = await new Promise<Blob>((resolve, reject) => {
						canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Blob failed")), "image/jpeg", 0.9);
					});
					processedFile = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
						type: "image/jpeg",
						lastModified: Date.now(),
					});
					toast.success("HEIC converted!");
				} catch {
					toast.error("Cannot convert this HEIC format", {
						description: "Use Settings > Camera > Formats > Most Compatible",
						duration: 8000,
					});
					return;
				}
			}

			const compressed = await compressImage(processedFile);
			setSelectedImage(compressed);
			const reader = new FileReader();
			fileReaderRef.current = reader;
			reader.onload = () => setImagePreview(reader.result as string);
			reader.readAsDataURL(compressed);
		} catch {
			toast.error("Failed to process image.");
		}
	};

	const handleClearImage = () => {
		setSelectedImage(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// ─── AI Parse ────────────────────────────────────────────────────────────────
	const handleParseWithAI = async () => {
		if (!aiText.trim()) {
			toast.error("Please describe your meal first");
			return;
		}

		setIsParsing(true);
		try {
			const result = await mealTrackerAPI.parseMeal(aiText.trim(), selectedImage ?? undefined);

			setFormData((prev) => ({
				...prev,
				foodName: result.foodName,
				calories: result.calories,
				proteinG: result.proteinG,
				carbsG: result.carbsG,
				fatG: result.fatG,
				servingSize: result.servingSize || prev.servingSize,
				servingUnit: result.servingUnit || prev.servingUnit,
				mealType: result.mealType || prev.mealType,
				notes: result.notes || prev.notes,
			}));

			setAiState({
				confidence: result.confidence,
				reasoning: result.reasoning ?? null,
				showDetails: true,
				hasResult: true,
			});

			const emoji = result.confidence === "high" ? "✓" : result.confidence === "medium" ? "~" : "?";
			toast.success(`Meal parsed with ${result.confidence} confidence ${emoji}`, {
				description: result.reasoning,
			});
		} catch {
			toast.error("Failed to parse meal. Please try again or fill in the details manually.");
		} finally {
			setIsParsing(false);
		}
	};

	// ─── Render ───────────────────────────────────────────────────────────────────
	return (
		<form onSubmit={handleSubmit} className="space-y-5 w-full max-w-full overflow-x-hidden">

			{/* ── AI Input Panel ── */}
			{!editingMealId && (
				<div className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent/40 to-background overflow-hidden">
					{/* Header */}
					<div className="px-4 pt-4 pb-3 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
							<Wand2 className="h-4 w-4 text-primary" />
						</div>
						<div>
							<p className="text-sm font-semibold leading-none">Describe your meal</p>
							<p className="text-xs text-muted-foreground mt-0.5">Type naturally or attach a photo</p>
						</div>
					</div>

					{/* Textarea */}
					<div className="px-4">
						<Textarea
							id="ai-meal-input"
							value={aiText}
							onChange={(e) => setAiText(e.target.value)}
							placeholder={"e.g. \"I had a bowl of khao pad moo with a fried egg on top around lunch\" or just \"grilled salmon 200g\""}
							rows={3}
							className="resize-none border-border/50 bg-background/70 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
							onKeyDown={(e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
									e.preventDefault();
									handleParseWithAI();
								}
							}}
						/>
					</div>

					{/* Image strip */}
					<div className="px-4 pt-2 pb-3">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
							onChange={handleImageSelect}
							className="hidden"
						/>

						{imagePreview ? (
							<div className="relative inline-block">
								<img
									src={imagePreview}
									alt="Food preview"
									className="h-20 w-20 rounded-xl object-cover border border-border/50"
								/>
								<button
									type="button"
									onClick={handleClearImage}
									className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
							>
								<ImagePlus className="h-4 w-4" />
								Attach photo (optional)
							</button>
						)}
					</div>

					{/* Parse button */}
					<div className="border-t border-border/40 px-4 py-3 flex items-center justify-between gap-3 bg-background/30">
						<span className="text-xs text-muted-foreground hidden sm:block">
							⌘ Enter to analyse
						</span>
						<Button
							type="button"
							onClick={handleParseWithAI}
							disabled={isParsing || !aiText.trim()}
							className="ml-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5"
							size="sm"
						>
							{isParsing ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Analysing…
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Analyse with AI
								</>
							)}
						</Button>
					</div>
				</div>
			)}

			{/* ── AI Confidence badge ── */}
			{aiState.hasResult && aiState.confidence && (
				<div
					className={cn(
						"flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs",
						aiState.confidence === "high"
							? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
							: aiState.confidence === "medium"
								? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
								: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
					)}
				>
					<span className="text-base leading-none mt-px">
						{aiState.confidence === "high" ? "✓" : aiState.confidence === "medium" ? "~" : "?"}
					</span>
					<div>
						<span className="font-semibold capitalize">{aiState.confidence} confidence</span>
						{aiState.reasoning && <p className="mt-0.5 opacity-80">{aiState.reasoning}</p>}
					</div>
				</div>
			)}

			{/* ── Review & Edit toggle ── */}
			<div>
				<button
					type="button"
					onClick={() => setAiState((prev) => ({ ...prev, showDetails: !prev.showDetails }))}
					className="flex w-full items-center justify-between rounded-xl border border-border/50 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
				>
					<span className="flex items-center gap-2">
						{aiState.hasResult ? (
							<>
								<span className="text-base">{formData.foodName ? "🍽️" : "📋"}</span>
								{formData.foodName || "Review & Edit"}
							</>
						) : (
							<>
								<span className="text-base">📋</span>
								{editingMealId ? "Edit Details" : "Fill in manually"}
							</>
						)}
					</span>
					{aiState.showDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
				</button>

				{aiState.showDetails && (
					<div className="mt-3 space-y-4 rounded-xl border border-border/40 bg-accent/10 p-4">

						{/* Meal Type */}
						<div className="space-y-2">
							<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meal Type</Label>
							<div className="flex flex-wrap gap-2">
								{MEAL_TYPES.map(({ value, label, icon }) => (
									<button
										key={value}
										type="button"
										onClick={() => handleChange("mealType", value as MealType)}
										className={cn(
											"flex-1 min-w-[80px] p-2.5 rounded-xl border text-sm font-medium transition-all",
											formData.mealType === value
												? "border-primary bg-primary/8 text-primary shadow-sm"
												: "border-input hover:bg-accent",
										)}
									>
										<div className="text-lg mb-0.5">{icon}</div>
										<div className="truncate text-xs">{label}</div>
									</button>
								))}
							</div>
						</div>

						{/* Date */}
						<div className="space-y-2">
							<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal text-sm",
											!formData.loggedAt && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.loggedAt
											? format(new Date(`${formData.loggedAt}T00:00:00`), "PPP")
											: <span>Pick a date</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={formData.loggedAt ? new Date(`${formData.loggedAt}T00:00:00`) : undefined}
										onSelect={(date) => {
											if (date) handleChange("loggedAt", getLocalDateString(date));
										}}
										disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* Food Name */}
						<div className="space-y-1.5">
							<Label htmlFor="foodName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Food Name *
							</Label>
							<Input
								id="foodName"
								value={formData.foodName}
								onChange={(e) => handleChange("foodName", e.target.value)}
								placeholder="e.g., Grilled chicken breast"
								required
								className="text-sm"
							/>
						</div>

						{/* Serving */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="servingSize" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Serving Size
								</Label>
								<Input
									id="servingSize"
									value={formData.servingSize || ""}
									onChange={(e) => handleChange("servingSize", e.target.value)}
									placeholder="e.g., 150"
									inputMode="numeric"
									className="text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="servingUnit" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Unit
								</Label>
								<Input
									id="servingUnit"
									value={formData.servingUnit || ""}
									onChange={(e) => handleChange("servingUnit", e.target.value)}
									placeholder="g, ml, piece…"
									className="text-sm"
								/>
							</div>
						</div>

						{/* Nutrition */}
						<div className="space-y-2">
							<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Nutrition
							</Label>
							<div className="grid grid-cols-2 gap-3">
								{NUTRITION_FIELDS.map(({ id, label, field, step, required }) => (
									<div key={id} className="space-y-1">
										<Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">{label}</Label>
										<Input
											id={id}
											type="number"
											min="0"
											step={step}
											value={formData[field] || ""}
											onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
											inputMode={step === "1" ? "numeric" : "decimal"}
											required={required}
											className="text-sm"
										/>
									</div>
								))}
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-1.5">
							<Label htmlFor="notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Notes (optional)
							</Label>
							<Textarea
								id="notes"
								value={formData.notes || ""}
								onChange={(e) => handleChange("notes", e.target.value)}
								placeholder="Add any additional notes…"
								rows={2}
								className="resize-none text-sm"
							/>
						</div>

					</div>
				)}
			</div>

			{/* ── Camera quick-attach (only show when form is shown while editing) ── */}
			{editingMealId && (
				<div className="flex items-center gap-3 rounded-xl border border-border/40 bg-accent/20 px-4 py-3">
					<Camera className="h-4 w-4 text-muted-foreground shrink-0" />
					<div className="flex-1 min-w-0">
						{imagePreview ? (
							<div className="flex items-center gap-2">
								<img src={imagePreview} alt="Food" className="h-8 w-8 rounded-lg object-cover" />
								<button type="button" onClick={handleClearImage} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								Attach photo to re-analyze
							</button>
						)}
					</div>
					<input
						ref={editingMealId ? fileInputRef : undefined}
						type="file"
						accept="image/*,.heic,.heif"
						onChange={handleImageSelect}
						className="hidden"
					/>
				</div>
			)}

			{/* ── Action Buttons ── */}
			<div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
				<Button
					type="submit"
					className="w-full rounded-xl gap-2"
					disabled={isSubmitting || (!formData.foodName && !aiState.hasResult)}
				>
					{isSubmitting ? (
						<><Loader2 className="h-4 w-4 animate-spin" />{editingMealId ? "Updating…" : "Logging…"}</>
					) : (
						<><Save className="h-4 w-4" />{editingMealId ? "Update Meal" : "Log Meal"}</>
					)}
				</Button>

				{isStandalone && (
					<Button type="button" variant="outline" onClick={onClose} className="w-full rounded-xl">
						Cancel
					</Button>
				)}

				{!editingMealId && (
					<Button
						type="button"
						variant="outline"
						onClick={handleSaveAsFavorite}
						disabled={createFavorite.isPending || !formData.foodName}
						className="w-full rounded-xl gap-2"
					>
						{createFavorite.isPending ? (
							<><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
						) : (
							<><Star className="h-4 w-4" />Save as Favourite</>
						)}
					</Button>
				)}
			</div>

		</form>
	);
}
