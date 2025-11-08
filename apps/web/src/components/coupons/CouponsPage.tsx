import { CheckSquare, Loader2, Square, Ticket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, couponApi } from "@/services/couponApi";
import type { Coupon, CouponType, CreateCouponRequest } from "@second-brain/types/coupon";
import { CouponForm } from "./CouponForm";
import { CouponList } from "./CouponList";

export function CouponsPage() {
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const loadCoupons = useCallback(async () => {
		try {
			setError(null);
			const response = await couponApi.getCoupons();
			setCoupons(response.coupons);
		} catch (err) {
			console.error("Failed to load coupons:", err);
			setError(err instanceof ApiError ? err.message : "Failed to load coupons");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Load coupons on component mount
	useEffect(() => {
		loadCoupons();
	}, [loadCoupons]);

	const handleCreateCoupon = async (data: CreateCouponRequest) => {
		try {
			setIsSubmitting(true);
			setError(null);
			const response = await couponApi.createCoupon(data);
			setCoupons((prev) => [response.coupon, ...prev]);
		} catch (err) {
			console.error("Failed to create coupon:", err);
			setError(err instanceof ApiError ? err.message : "Failed to create coupon");
			throw err; // Re-throw to prevent form from closing
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBulkCreateCoupons = async (codes: string[], type: CouponType, expiresAt?: string) => {
		try {
			setIsSubmitting(true);
			setError(null);

			// Create all coupons in parallel
			const promises = codes.map((code) =>
				couponApi.createCoupon({
					code,
					type,
					expiresAt: expiresAt,
				}),
			);
			const responses = await Promise.all(promises);

			// Add all new coupons to the list
			const newCoupons = responses.map((response) => response.coupon);
			setCoupons((prev) => [...newCoupons, ...prev]);
		} catch (err) {
			console.error("Failed to create coupons:", err);
			setError(err instanceof ApiError ? err.message : "Failed to create some coupons");
			throw err; // Re-throw to prevent form from closing
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleUsed = async (id: string, isUsed: boolean) => {
		try {
			setIsUpdating(true);
			setError(null);
			const response = await couponApi.updateCoupon(id, { isUsed: isUsed });
			setCoupons((prev) => prev.map((coupon) => (coupon.id === id ? response.coupon : coupon)));
		} catch (err) {
			console.error("Failed to update coupon:", err);
			setError(err instanceof ApiError ? err.message : "Failed to update coupon");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteCoupon = async (id: string) => {
		try {
			setIsUpdating(true);
			setError(null);
			await couponApi.deleteCoupon(id);
			setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
		} catch (err) {
			console.error("Failed to delete coupon:", err);
			setError(err instanceof ApiError ? err.message : "Failed to delete coupon");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleToggleSelection = (id: string) => {
		setSelectedIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	};

	const handleSelectAll = (filter: "all" | "active" | "used") => {
		const filteredCoupons =
			filter === "active" ? activeCoupons : filter === "used" ? usedExpiredCoupons : coupons;

		const allIds = filteredCoupons.map((c) => c.id);
		setSelectedIds(new Set(allIds));
	};

	const handleDeselectAll = () => {
		setSelectedIds(new Set());
	};

	const handleBulkDelete = async () => {
		if (selectedIds.size === 0) return;

		try {
			setIsUpdating(true);
			setError(null);

			const idsArray = Array.from(selectedIds);
			const response = await couponApi.bulkDeleteCoupons(idsArray);

			// Remove deleted coupons from the list
			setCoupons((prev) => prev.filter((coupon) => !selectedIds.has(coupon.id)));

			// Clear selection and exit selection mode
			setSelectedIds(new Set());
			setSelectionMode(false);

			toast.success(response.message, {
				description: `${response.deletedCount} coupon(s) deleted successfully`,
				duration: 3000,
			});
		} catch (err) {
			console.error("Failed to bulk delete coupons:", err);
			const errorMsg = err instanceof ApiError ? err.message : "Failed to delete coupons";
			setError(errorMsg);
			toast.error("Bulk delete failed", {
				description: errorMsg,
				duration: 3000,
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const handleToggleSelectionMode = () => {
		setSelectionMode(!selectionMode);
		if (selectionMode) {
			// Exiting selection mode, clear selections
			setSelectedIds(new Set());
		}
	};

	const activeCoupons = coupons.filter(
		(c) => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) >= new Date()),
	);
	const usedExpiredCoupons = coupons.filter(
		(c) => c.isUsed || (c.expiresAt && new Date(c.expiresAt) < new Date()),
	);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin mr-2" />
						<span>Loading coupons...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center gap-3 mb-6">
					<Ticket className="h-8 w-8" />
					<div>
						<h1 className="text-3xl font-bold">Coupon Book</h1>
						<p className="text-muted-foreground">Manage your coupon codes and track usage</p>
					</div>
				</div>

				{error && (
					<Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
						<CardContent className="pt-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-2">
									<div className="text-red-500 text-lg mt-0.5">⚠️</div>
									<div className="flex-1">
										<h3 className="font-medium text-red-800 dark:text-red-200 mb-1">API Error</h3>
										<p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
										<div className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1">
											<p>• Check if you're logged in properly</p>
											<p>• Ensure the database is properly initialized</p>
											<p>• Check browser console for more details</p>
										</div>
									</div>
								</div>
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 h-8 px-2"
										onClick={loadCoupons}
										title="Retry loading coupons"
									>
										Retry
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 h-8 w-8 p-0 shrink-0"
										onClick={() => setError(null)}
										title="Dismiss error"
									>
										✕
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				<div className="space-y-6">
					<CouponForm
						onSubmit={handleCreateCoupon}
						onBulkSubmit={handleBulkCreateCoupons}
						isSubmitting={isSubmitting}
						isOpen={showForm}
						onToggle={() => setShowForm(!showForm)}
					/>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Your Coupons</CardTitle>
									<CardDescription>Manage and track your coupon codes</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									{!selectionMode && activeCoupons.length > 0 && (
										<Badge variant="outline">{activeCoupons.length} Active</Badge>
									)}
									{!selectionMode && usedExpiredCoupons.length > 0 && (
										<Badge variant="secondary">{usedExpiredCoupons.length} Used/Expired</Badge>
									)}
									{!selectionMode && coupons.length === 0 && (
										<Badge variant="outline" className="text-muted-foreground">
											No coupons yet
										</Badge>
									)}
									{selectionMode && (
										<Badge variant="default" className="bg-primary">
											{selectedIds.size} selected
										</Badge>
									)}
									{coupons.length > 0 && (
										<Button
											variant={selectionMode ? "default" : "outline"}
											size="sm"
											onClick={handleToggleSelectionMode}
											className="ml-2"
										>
											{selectionMode ? (
												<>
													<CheckSquare className="h-4 w-4 mr-1" />
													Done
												</>
											) : (
												<>
													<Square className="h-4 w-4 mr-1" />
													Select
												</>
											)}
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{selectionMode && (
								<div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 flex-wrap">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleSelectAll("all")}
											disabled={coupons.length === 0 || selectedIds.size === coupons.length}
										>
											Select All
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleDeselectAll}
											disabled={selectedIds.size === 0}
										>
											Deselect All
										</Button>
									</div>
									<Button
										variant="destructive"
										size="sm"
										onClick={handleBulkDelete}
										disabled={selectedIds.size === 0 || isUpdating}
									>
										{isUpdating ? (
											<>
												<Loader2 className="h-4 w-4 mr-1 animate-spin" />
												Deleting...
											</>
										) : (
											<>
												<Trash2 className="h-4 w-4 mr-1" />
												Delete ({selectedIds.size})
											</>
										)}
									</Button>
								</div>
							)}

							<Tabs defaultValue="all" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="all">
										All {coupons.length > 0 ? `(${coupons.length})` : ""}
									</TabsTrigger>
									<TabsTrigger value="active">
										Active {activeCoupons.length > 0 ? `(${activeCoupons.length})` : ""}
									</TabsTrigger>
									<TabsTrigger value="used">
										Used/Expired{" "}
										{usedExpiredCoupons.length > 0 ? `(${usedExpiredCoupons.length})` : ""}
									</TabsTrigger>
								</TabsList>

								<TabsContent value="all" className="mt-4">
									<CouponList
										coupons={coupons}
										onToggleUsed={handleToggleUsed}
										onDelete={handleDeleteCoupon}
										isUpdating={isUpdating}
										filter="all"
										selectionMode={selectionMode}
										selectedIds={selectedIds}
										onToggleSelection={handleToggleSelection}
									/>
								</TabsContent>

								<TabsContent value="active" className="mt-4">
									<CouponList
										coupons={coupons}
										onToggleUsed={handleToggleUsed}
										onDelete={handleDeleteCoupon}
										isUpdating={isUpdating}
										filter="active"
										selectionMode={selectionMode}
										selectedIds={selectedIds}
										onToggleSelection={handleToggleSelection}
									/>
								</TabsContent>

								<TabsContent value="used" className="mt-4">
									<CouponList
										coupons={coupons}
										onToggleUsed={handleToggleUsed}
										onDelete={handleDeleteCoupon}
										isUpdating={isUpdating}
										filter="used"
										selectionMode={selectionMode}
										selectedIds={selectedIds}
										onToggleSelection={handleToggleSelection}
									/>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
