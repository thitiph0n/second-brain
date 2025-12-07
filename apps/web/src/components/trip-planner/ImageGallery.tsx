import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItineraryImage } from "./types";

interface ImageGalleryProps {
	images: ItineraryImage[];
	onRemove?: (imageId: string) => void;
	className?: string;
	variant?: "grid" | "list";
	maxColumns?: number;
	showControls?: boolean;
	showAltText?: boolean;
}

interface ImageLightboxProps {
	images: ItineraryImage[];
	initialIndex?: number;
	onClose?: () => void;
	onRemove?: (imageId: string) => void;
}

function ImageLightbox({ images, initialIndex = 0, onClose, onRemove }: ImageLightboxProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [showControls, setShowControls] = useState(true);
	const imgRef = useRef<HTMLImageElement>(null);

	const currentImage = images[currentIndex];

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
		setZoom(1);
		setRotation(0);
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
		setZoom(1);
		setRotation(0);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		switch (e.key) {
			case "ArrowLeft":
				handlePrevious();
				break;
			case "ArrowRight":
				handleNext();
				break;
			case "Escape":
				onClose?.();
				break;
		}
	};

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.25, 0.5));
	};

	const handleResetZoom = () => {
		setZoom(1);
		setRotation(0);
	};

	const handleRotate = () => {
		setRotation((prev) => (prev + 90) % 360);
	};

	const handleDownload = async () => {
		try {
			const response = await fetch(currentImage.url);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `trip-image-${currentImage.id}${currentImage.url.split(".").pop() || ".jpg"}`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Download failed:", error);
		}
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: "Trip Image",
					text: currentImage.altText || "Check out this photo from my trip!",
					url: currentImage.url,
				});
			} catch (error) {
				// User cancelled or error occurred
			}
		} else {
			// Fallback to copying URL
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(currentImage.url);
				// Show toast notification
			}
		}
	};

	const handleRemove = () => {
		if (confirm("Are you sure you want to remove this image?")) {
			onRemove?.(currentImage.id);
			if (images.length > 1) {
				handleNext();
			} else {
				onClose?.();
			}
		}
	};

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [images, currentIndex]);

	if (!currentImage) return null;

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="max-w-none p-0 bg-black">
				{/* Close button */}
				<Button
					variant="ghost"
					size="sm"
					className="absolute top-4 right-4 h-8 w-8 p-0 z-50 bg-black/50 text-white hover:bg-black/70"
					onClick={onClose}
				>
					<X className="h-4 w-4" />
				</Button>

				 {/* Image container */}
				<div className="relative flex items-center justify-center min-h-screen p-4">
					<img
						ref={imgRef}
						src={currentImage.url}
						alt={currentImage.altText || "Gallery image"}
						className="max-w-full max-h-full object-contain transition-transform duration-200"
						style={{
							transform: `scale(${zoom}) rotate(${rotation}deg)`,
							cursor: zoom > 1 ? "grab" : "default",
						}}
						onMouseDown={(e) => {
							if (zoom > 1) {
								const startX = e.clientX;
								const startY = e.clientY;
								const startTransform = imgRef.current?.style.transform || "";

								const handleMouseMove = (moveEvent: MouseEvent) => {
									const deltaX = moveEvent.clientX - startX;
									const deltaY = moveEvent.clientY - startY;
									imgRef.current!.style.transform = `${startTransform} translate(${deltaX}px, ${deltaY}px)`;
								};

								const handleMouseUp = () => {
									document.removeEventListener("mousemove", handleMouseMove);
									document.removeEventListener("mouseup", handleMouseUp);
								};

								document.addEventListener("mousemove", handleMouseMove);
								document.addEventListener("mouseup", handleMouseUp);
							}
						}}
					/>

					 {/* Navigation buttons */}
					{images.length > 1 && (
						<>
							<Button
								variant="ghost"
								size="sm"
								className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/50 text-white hover:bg-black/70 z-50"
								onClick={handlePrevious}
							>
								<ChevronLeft className="h-6 w-6" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/50 text-white hover:bg-black/70 z-50"
								onClick={handleNext}
							>
								<ChevronRight className="h-6 w-6" />
							</Button>
						</>
					)}

					 {/* Image counter */}
					{images.length > 1 && (
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
							{currentIndex + 1} / {images.length}
						</div>
					)}

					 {/* Control panel */}
					{showControls && (
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 p-2 rounded-lg">
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-white hover:bg-black/70"
								onClick={handleZoomOut}
								disabled={zoom <= 0.5}
							>
								<ZoomOut className="h-4 w-4" />
							</Button>
							<span className="text-white text-xs min-w-[40px] text-center">
								{Math.round(zoom * 100)}%
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-white hover:bg-black/70"
								onClick={handleZoomIn}
								disabled={zoom >= 3}
							>
								<ZoomIn className="h-4 w-4" />
							</Button>
							<div className="w-px h-6 bg-white/30 mx-1" />
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-white hover:bg-black/70"
								onClick={handleResetZoom}
							>
								<RotateCcw className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 text-white hover:bg-black/70"
								onClick={handleRotate}
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
							</Button>
						</div>
					)}

					 {/* Action buttons */}
					<div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70 z-50"
							onClick={handleDownload}
						>
							<Download className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70 z-50"
							onClick={handleShare}
						>
							<Share2 className="h-4 w-4" />
						</Button>
						{onRemove && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70 z-50"
								onClick={handleRemove}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>

					 {/* Alt text overlay */}
					{currentImage.altText && (
						<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white p-3 rounded-lg max-w-md">
							<p className="text-sm">{currentImage.altText}</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function ImageGallery({
	images,
	onRemove,
	className,
	variant = "grid",
	maxColumns = 5,
	showControls = true,
	showAltText = true,
}: ImageGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const openLightbox = (index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	if (images.length === 0) {
		return null;
	}

	if (variant === "list") {
		return (
			<div className={cn("space-y-4", className)}>
				{images.map((image, index) => (
					<Card key={image.id} className="overflow-hidden">
						<CardContent className="p-4">
							<div className="flex gap-4">
								<div className="flex-shrink-0">
									<img
										src={image.url}
										alt={image.altText || `Gallery image ${index + 1}`}
										className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
										onClick={() => openLightbox(index)}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between">
										<div>
											<p className="font-medium">Image {index + 1}</p>
											{image.altText && (
												<p className="text-sm text-muted-foreground mt-1">
													{image.altText}
												</p>
											)}
											<p className="text-xs text-muted-foreground mt-1">
												Uploaded: {new Date(image.uploadedAt).toLocaleDateString()}
											</p>
										</div>
										{onRemove && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onRemove(image.id)}
												className="h-8 w-8 p-0 text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Image grid */}
			<div className={cn(
				"grid gap-4",
				maxColumns === 2 && "grid-cols-2",
				maxColumns === 3 && "grid-cols-3",
				maxColumns === 4 && "grid-cols-4",
				maxColumns >= 5 && "grid-cols-5"
			)}>
				{images.map((image, index) => (
					<Card key={image.id} className="group relative aspect-square">
						<Card className="overflow-hidden h-full hover:shadow-lg transition-shadow cursor-pointer">
							<CardContent className="p-0 h-full">
								<img
									src={image.url}
									alt={image.altText || `Gallery image ${index + 1}`}
									className="w-full h-full object-cover"
									onClick={() => openLightbox(index)}
								/>
							</CardContent>
						</Card>

						 {/* Hover overlay */}
						<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
							{showControls && (
								<>
									<Button
										size="sm"
										variant="secondary"
										className="h-8 w-8 p-0"
										onClick={() => openLightbox(index)}
									>
										<ZoomIn className="h-4 w-4" />
									</Button>
									{onRemove && (
										<Button
											size="sm"
											variant="destructive"
											className="h-8 w-8 p-0"
											onClick={(e) => {
												e.stopPropagation();
												onRemove(image.id);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</>
							)}
						</div>

					 {/* Alt text badge */}
						{image.altText && (
							<div className="absolute bottom-2 left-2 right-2">
								<Badge variant="secondary" className="text-xs">
									{image.altText}
								</Badge>
							</div>
						)}
					</Card>
				))}
			</div>

		 {/* Lightbox */}
			{lightboxOpen && (
				<ImageLightbox
					images={images}
					initialIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
					onRemove={onRemove}
				/>
			)}
		</div>
	);
}

// Compact image gallery for previews
interface CompactImageGalleryProps {
	images: ItineraryImage[];
	maxImages?: number;
	className?: string;
	onViewAll?: () => void;
}

export function CompactImageGallery({
	images,
	maxImages = 3,
	className,
	onViewAll,
}: CompactImageGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const displayImages = images.slice(0, maxImages);
	const remainingCount = images.length - maxImages;

	const openLightbox = (index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	if (images.length === 0) {
		return null;
	}

	return (
		<div className={cn("relative", className)}>
			{/* Image previews */}
			<div className="flex -space-x-2">
				{displayImages.map((image, index) => (
					<div
						key={image.id}
						className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-105"
						onClick={() => openLightbox(index)}
					>
						<img
							src={image.url}
							alt={image.altText || `Preview ${index + 1}`}
							className="w-full h-full object-cover"
						/>
						{image.altText && (
							<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
								{image.altText}
							</div>
						)}
					</div>
				))}

				{remainingCount > 0 && (
					<div className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted text-sm font-medium border-2 border-background">
						+{remainingCount}
					</div>
				)}
			</div>

			 {/* View all button */}
			{onViewAll && images.length > maxImages && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onViewAll}
					className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-background"
				>
					<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
				</Button>
			)}

			 {/* Lightbox */}
			{lightboxOpen && (
				<ImageLightbox
					images={images}
					initialIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
				/>
			)}
		</div>
	);
}