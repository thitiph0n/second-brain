import type { Coupon } from "@second-brain/types/coupon";
import { CheckSquare, Loader2, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CouponForm } from "@/components/coupons/CouponForm";
import { CouponItem } from "@/components/coupons/CouponItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const mockCoupons: Coupon[] = [
	{
		id: "1",
		userId: "demo",
		code: "NOODLE50",
		type: "food",
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
		isUsed: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "2",
		userId: "demo",
		code: "RIDE20",
		type: "ride",
		isUsed: false,
		createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
		updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "3",
		userId: "demo",
		code: "USED123",
		type: "food",
		isUsed: true,
		usedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
		createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "4",
		userId: "demo",
		code: "EXPIRED",
		type: "food",
		expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
		isUsed: false,
		createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
	},
];

export function CouponDemo() {
	const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
	const [showForm, setShowForm] = useState(false);
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isDeleting, setIsDeleting] = useState(false);

	const handleToggleUsed = async (id: string, isUsed: boolean) => {
		setCoupons((prev) =>
			prev.map((coupon) =>
				coupon.id === id
					? { ...coupon, isUsed: isUsed, usedAt: isUsed ? new Date().toISOString() : undefined }
					: coupon,
			),
		);
	};

	const handleDelete = async (id: string) => {
		setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
	};

	const handleSubmit = async (data: any) => {
		const newCoupon: Coupon = {
			id: Math.random().toString(36).substr(2, 9),
			userId: "demo",
			code: data.code,
			type: data.type,
			expiresAt: data.expiresAt,
			isUsed: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		setCoupons((prev) => [newCoupon, ...prev]);
	};

	const handleBulkSubmit = async (codes: string[], type: any, expiresAt?: string) => {
		const newCoupons: Coupon[] = codes.map((code) => ({
			id: Math.random().toString(36).substr(2, 9),
			userId: "demo",
			code,
			type,
			expiresAt: expiresAt,
			isUsed: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}));
		setCoupons((prev) => [...newCoupons, ...prev]);
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

	const handleSelectAll = () => {
		setSelectedIds(new Set(coupons.map((c) => c.id)));
	};

	const handleDeselectAll = () => {
		setSelectedIds(new Set());
	};

	const handleBulkDelete = async () => {
		if (selectedIds.size === 0) return;

		setIsDeleting(true);
		// Simulate async operation
		await new Promise((resolve) => setTimeout(resolve, 500));

		setCoupons((prev) => prev.filter((coupon) => !selectedIds.has(coupon.id)));

		toast.success("Coupons deleted successfully", {
			description: `${selectedIds.size} coupon(s) deleted`,
			duration: 3000,
		});

		setSelectedIds(new Set());
		setSelectionMode(false);
		setIsDeleting(false);
	};

	const handleToggleSelectionMode = () => {
		setSelectionMode(!selectionMode);
		if (selectionMode) {
			setSelectedIds(new Set());
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">🍜 Coupon Book Demo</h1>
				<p className="text-muted-foreground">
					Demo showing the improved UI for mobile devices, bulk expiration support, and multi-select
					deletion
				</p>
				<p className="text-sm text-orange-600 mt-2">
					📱 Resize your browser to see mobile responsiveness improvements
				</p>
			</div>

			<div className="space-y-6">
				<CouponForm
					onSubmit={handleSubmit}
					onBulkSubmit={handleBulkSubmit}
					isSubmitting={false}
					isOpen={showForm}
					onToggle={() => setShowForm(!showForm)}
				/>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold">Sample Coupons</h2>
							<div className="flex items-center gap-2">
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

						{selectionMode && (
							<div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										onClick={handleSelectAll}
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
									disabled={selectedIds.size === 0 || isDeleting}
								>
									{isDeleting ? (
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

						<div className="space-y-3">
							{coupons.map((coupon) => (
								<CouponItem
									key={coupon.id}
									coupon={coupon}
									onToggleUsed={handleToggleUsed}
									onDelete={handleDelete}
									isUpdating={false}
									selectionMode={selectionMode}
									isSelected={selectedIds.has(coupon.id)}
									onToggleSelection={handleToggleSelection}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
