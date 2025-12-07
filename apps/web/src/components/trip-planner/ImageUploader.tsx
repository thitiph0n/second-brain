import { useState, useRef, useEffect } from "react";
import { X, Upload, Image as ImageIcon, Camera, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ItineraryImage } from "./types";

interface ImageUploadResult {
	file: File;
	url: string;
	altText?: string;
}

interface ImageUploaderProps {
	value?: ItineraryImage[];
	onChange: (images: ItineraryImage[]) => void;
	maxFiles?: number;
	maxFileSize?: number; // in MB
	acceptedTypes?: string[];
	className?: string;
	disabled?: boolean;
	showAltText?: boolean;
	onUpload?: (file: File) => Promise<string>;
}

export function ImageUploader({
	value = [],
	onChange,
	maxFiles = 10,
	maxFileSize = 10,
	acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"],
	className,
	disabled = false,
	showAltText = true,
	onUpload,
}: ImageUploaderProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [dragActive, setDragActive] = useState(false);
	const [altTexts, setAltTexts] = useState<Record<string, string>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = async (files: FileList) => {
		if (disabled) return;

		const filesArray = Array.from(files);
		const validFiles = filesArray.filter(file => {
			// Check file type
			if (!acceptedTypes.includes(file.type) && !isImageFile(file.name)) {
				alert(`File "${file.name}" is not a supported image type`);
				return false;
			}

			// Check file size
			if (file.size > maxFileSize * 1024 * 1024) {
				alert(`File "${file.name}" is too large. Maximum size is ${maxFileSize}MB`);
				return false;
			}

			return true;
		});

		if (value.length + validFiles.length > maxFiles) {
			alert(`You can only upload up to ${maxFiles} images`);
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const newImages: ItineraryImage[] = [];

			for (let i = 0; i < validFiles.length; i++) {
				const file = validFiles[i];
				let url: string;

				if (onUpload) {
					// Custom upload handler
					url = await onUpload(file);
				} else {
					// Use object URL for client-side preview
					url = URL.createObjectURL(file);
				}

				const image: ItineraryImage = {
					id: `img-${Date.now()}-${i}`,
					url,
					altText: altTexts[url] || "",
					uploadedAt: new Date().toISOString(),
					file: onUpload ? undefined : file, // Store file if not uploaded immediately
				};

				newImages.push(image);

				// Simulate progress
				setUploadProgress(((i + 1) / validFiles.length) * 100);
			}

			const updatedImages = [...value, ...newImages];
			onChange(updatedImages);

			// Clear alt texts for new URLs
			const newAltTexts: Record<string, string> = { ...altTexts };
			validFiles.forEach(file => {
				const url = URL.createObjectURL(file);
				delete newAltTexts[url];
			});
			setAltTexts(newAltTexts);

		} catch (error) {
			console.error("Upload failed:", error);
			alert("Failed to upload some images");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFiles(e.dataTransfer.files);
		}
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFiles(e.target.files);
		}
	};

	const handleRemoveImage = (id: string) => {
		const updatedImages = value.filter(img => img.id !== id);
		onChange(updatedImages);

		// Revoke object URL if it was created by us
		const image = value.find(img => img.id === id);
		if (image && image.url.startsWith("blob:")) {
			URL.revokeObjectURL(image.url);
		}
	};

	const handleUpdateAltText = (id: string, altText: string) => {
		setAltTexts(prev => ({ ...prev, [id]: altText }));
		const updatedImages = value.map(img => img.id === id ? { ...img, altText } : img);
		onChange(updatedImages);
	};

	const isImageFile = (fileName: string) => {
		const extension = fileName.toLowerCase().split(".").pop();
		return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension || "");
	};

	const previewFiles = Array.from(value).map((image, index) => {
		const isLocal = image.url.startsWith("blob:");
		const file = isLocal ? null : undefined;
		return { image, file };
	});

	return (
		<div className={cn("space-y-4", className)}>
			{/* Upload Area */}
			<div
				className={cn(
					"relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
					dragActive && "border-primary bg-primary/5",
					disabled && "opacity-50 cursor-not-allowed",
					!value.length && "border-muted-foreground/25"
				)}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept={acceptedTypes.join(",")}
					onChange={handleFileInput}
					disabled={disabled || isUploading}
					className="hidden"
				/>

				<div className="space-y-4">
					<div className="flex justify-center">
						{isUploading ? (
							<Camera className="h-12 w-12 text-muted-foreground animate-pulse" />
						) : (
							<Upload className="h-12 w-12 text-muted-foreground" />
						)}
					</div>

					{isUploading ? (
						<div className="space-y-2">
							<p className="text-sm font-medium">Uploading images...</p>
							<Progress value={uploadProgress} className="w-full" />
							<p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
						</div>
					) : (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								{value.length > 0 ? "Add more images" : "Upload images"}
							</p>
							<p className="text-xs text-muted-foreground">
								{value.length > 0
									? `${value.length}/${maxFiles} images uploaded`
									: `Drag and drop images here, or click to browse`}
							</p>
						</div>
					)}

					{!isUploading && (
						<Button
							onClick={() => fileInputRef.current?.click()}
							variant="outline"
							disabled={disabled || value.length >= maxFiles}
							size="sm"
						>
							<Plus className="h-4 w-4 mr-2" />
							{value.length >= maxFiles ? "Maximum reached" : "Choose Files"}
						</Button>
					)}
				</div>
			</div>

			{/* Image Grid */}
			{value.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{value.map((image) => (
						<div key={image.id} className="relative group">
							{/* Image Preview */}
							<Card className="overflow-hidden aspect-square">
								<CardContent className="p-0 h-full">
									<img
										src={image.url}
										alt={image.altText || "Preview"}
										className="w-full h-full object-cover"
										onError={(e) => {
											e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
										}}
									/>
								</CardContent>
							</Card>

							{/* Overlay Controls */}
							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
								{onUpload && (
									<>
										<Button
											size="sm"
											variant="secondary"
											className="h-8 w-8 p-0"
											onClick={() => {
												// In a real app, you might want to re-upload this image
											}}
										>
											<ImageIcon className="h-4 w-4" />
										</Button>
									</>
								)}

								<Button
									size="sm"
									variant="destructive"
									className="h-8 w-8 p-0"
									onClick={() => handleRemoveImage(image.id)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							{/* Alt Text Input */}
							{showAltText && (
								<div className="mt-2">
									<input
										type="text"
										value={image.altText || ""}
										onChange={(e) => handleUpdateAltText(image.id, e.target.value)}
										placeholder="Add description..."
										className="w-full text-xs p-1 border rounded truncate"
										maxLength={100}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* File Info */}
			{value.length > 0 && (
				<div className="text-xs text-muted-foreground">
					<p>{value.length} image{value.length !== 1 ? "s" : ""} uploaded</p>
					<p className="mt-1">
						Supported formats: {acceptedTypes.map(type => type.split("/")[1].toUpperCase()).join(", ")} • Max {maxFileSize}MB per file
					</p>
				</div>
			)}
		</div>
	);
}

// Single image uploader component
interface SingleImageUploaderProps {
	value?: string; // URL string
	onChange: (url: string | null) => void;
	maxFileSize?: number;
	disabled?: boolean;
	className?: string;
	onUpload?: (file: File) => Promise<string>;
}

export function SingleImageUploader({
	value,
	onChange,
	maxFileSize = 5,
	disabled = false,
	className,
	onUpload,
}: SingleImageUploaderProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = async (file: File) => {
		if (disabled) return;

		if (file.size > maxFileSize * 1024 * 1024) {
			alert(`File is too large. Maximum size is ${maxFileSize}MB`);
			return;
		}

		setIsUploading(true);

		try {
			let url: string;

			if (onUpload) {
				url = await onUpload(file);
			} else {
				url = URL.createObjectURL(file);
			}

			onChange(url);
		} catch (error) {
			console.error("Upload failed:", error);
			alert("Failed to upload image");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFile(e.target.files[0]);
		}
	};

	const handleRemove = () => {
		if (value && value.startsWith("blob:")) {
			URL.revokeObjectURL(value);
		}
		onChange(null);
	};

	return (
		<div className={cn("space-y-4", className)}>
			{value ? (
				<div className="relative">
					<Card>
						<CardContent className="p-0">
							<img
								src={value}
								alt="Uploaded"
								className="w-full h-48 object-cover"
							/>
						</CardContent>
					</Card>
					<Button
						variant="destructive"
						size="sm"
						className="absolute top-2 right-2 h-8 w-8 p-0"
						onClick={handleRemove}
						disabled={disabled}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<div
					className={cn(
						"border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
						dragActive && "border-primary bg-primary/5",
						disabled && "opacity-50 cursor-not-allowed"
					)}
					onDragEnter={(e) => {
						e.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={(e) => {
						e.preventDefault();
						setDragActive(false);
					}}
					onDragOver={(e) => e.preventDefault()}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileInput}
						disabled={disabled || isUploading}
						className="hidden"
					/>

					{isUploading ? (
						<div className="space-y-2">
							<Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
							<p className="text-sm">Uploading...</p>
						</div>
					) : (
						<div className="space-y-2">
							<Camera className="h-8 w-8 mx-auto text-muted-foreground" />
							<p className="text-sm font-medium">Click to upload image</p>
							<p className="text-xs text-muted-foreground">
								Drag and drop, or click to browse. Max {maxFileSize}MB.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}