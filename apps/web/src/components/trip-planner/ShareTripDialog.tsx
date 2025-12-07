import { useState } from "react";
import { format } from "date-fns";
import { Copy, Share2, Calendar, MapPin, Users, Eye, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Trip } from "./types";
import { cn } from "@/lib/utils";
import { QRCodeShare } from "./QRCodeShare";

interface ShareTripDialogProps {
	trip: Trip;
	onShare?: (data: { isPublic: boolean; sharedAt?: string }) => void;
	children: React.ReactNode;
	className?: string;
}

export function ShareTripDialog({ trip, onShare, children, className }: ShareTripDialogProps) {
	const [isPublic, setIsPublic] = useState(trip.isPublic);
	const [isSharing, setIsSharing] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	// Generate share URL (in real app, this would come from backend)
	const generateShareUrl = () => {
		const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
		return `${baseUrl}/shared/${trip.id}`;
	};

	const shareUrl = generateShareUrl();

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			toast.success("Link copied!");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy link");
		}
	};

	const handleShare = async () => {
		setIsSharing(true);
		try {
			await onShare?.({
				isPublic,
				sharedAt: isPublic ? new Date().toISOString() : undefined,
			});
			toast.success(isPublic ? "Trip is now public" : "Trip is now private");
		} catch (error) {
			toast.error("Failed to update settings");
		} finally {
			setIsSharing(false);
		}
	};

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: trip.name,
					text: `Check out my trip to ${trip.name}!`,
					url: shareUrl,
				});
			} catch (error) {
				// User cancelled or error occurred
			}
		} else {
			// Fallback to copying to clipboard
			handleCopyToClipboard();
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{children}
			</DialogTrigger>
			<DialogContent className={cn("max-w-2xl", className)}>
				<DialogHeader>
					<DialogTitle>Share Trip</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Trip Preview */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Trip Preview</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h3 className="font-semibold text-lg">{trip.name}</h3>
								{trip.description && (
									<p className="text-muted-foreground mt-1">{trip.description}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{new Set(trip.itinerary?.map(item => item.location?.city).filter(Boolean)).size} cities
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{trip.itinerary?.length || 0} activities
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Share Settings */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Sharing Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor="public-share">Make this trip public</Label>
									<p className="text-sm text-muted-foreground">
										Allow others to view your trip details and itinerary
									</p>
								</div>
								<Switch
									id="public-share"
									checked={isPublic}
									onCheckedChange={setIsPublic}
								/>
							</div>

							{isPublic && (
								<div className="space-y-4">
                                     {/* QR Code */}
                                     <div className="flex justify-center py-2">
                                         <QRCodeShare url={shareUrl} size={150} />
                                     </div>

									<div className="space-y-2">
										<Label>Shareable Link</Label>
										<div className="flex gap-2">
											<Input
												value={shareUrl}
												readOnly
												className="flex-1"
											/>
											<Button
												onClick={handleCopyToClipboard}
												variant="outline"
												size="sm"
												disabled={isSharing}
											>
												{copied ? (
													<Copied />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>

									<div className="flex gap-2">
										<Button
											onClick={handleNativeShare}
											variant="outline"
											disabled={isSharing}
											className="flex-1"
										>
											<Share2 className="h-4 w-4 mr-2" />
											Share via OS
										</Button>
										<Button
											onClick={handleShare}
											disabled={isSharing}
											className="flex-1"
										>
											{isSharing ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Saving...
												</>
											) : (
												<>
													<Share2 className="h-4 w-4 mr-2" />
													Update Sharing
												</>
											)}
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Preview */}
					{isPublic && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Preview</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowPreview(!showPreview)}
									>
										{showPreview ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</Button>
								</div>
							</CardHeader>
							{showPreview && (
								<CardContent>
									<div className="space-y-4">
										<h3 className="font-semibold">{trip.name}</h3>
										{trip.description && (
											<p className="text-muted-foreground">{trip.description}</p>
										)}
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div className="space-y-1">
												<p className="font-medium">Dates</p>
												<p className="text-muted-foreground">
													{format(new Date(trip.startDate), "MMM d, yyyy")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
												</p>
											</div>
											<div className="space-y-1">
												<p className="font-medium">Duration</p>
												<p className="text-muted-foreground">
													{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
												</p>
											</div>
										</div>
										<div className="pt-2 border-t">
											<p className="text-xs text-muted-foreground">
												This is a preview of what others will see. Your personal information is not included.
											</p>
										</div>
									</div>
								</CardContent>
							)}
						</Card>
					)}

					{/* Warning */}
					{isPublic && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<Warning />
								<div className="space-y-1">
									<h4 className="font-medium text-yellow-800">Public Sharing Notice</h4>
									<ul className="text-sm text-yellow-700 space-y-1">
										<li>Your trip details will be visible to anyone with the link</li>
										<li>Remove personal information from notes before sharing</li>
										<li>You can make the trip private again at any time</li>
									</ul>
								</div>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Helper components
function Copied() {
	return (
		<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
		</svg>
	);
}

function Warning() {
	return (
		<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>
	);
}