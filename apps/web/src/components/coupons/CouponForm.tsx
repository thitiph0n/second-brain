import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Clipboard, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CouponType, CreateCouponRequest } from "@second-brain/types/coupon";

interface CouponFormProps {
	onSubmit: (data: CreateCouponRequest) => Promise<void>;
	onBulkSubmit?: (codes: string[], type: CouponType, expiresAt?: string) => Promise<void>;
	isSubmitting?: boolean;
	isOpen: boolean;
	onToggle: () => void;
}

export function CouponForm({
	onSubmit,
	onBulkSubmit,
	isSubmitting = false,
	isOpen,
	onToggle,
}: CouponFormProps) {
	const [code, setCode] = useState("");
	const [bulkCodes, setBulkCodes] = useState("");
	const [isBulkMode, setIsBulkMode] = useState(false);
	const [selectedType, setSelectedType] = useState<CouponType>("food");
	const [expirationDate, setExpirationDate] = useState<Date | undefined>();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isBulkMode) {
			if (!bulkCodes.trim() || !onBulkSubmit) return;

			const codes = bulkCodes
				.split("\n")
				.map((code) => code.trim())
				.filter((code) => code.length > 0);

			if (codes.length === 0) return;

			const expiresAt = expirationDate ? expirationDate.toISOString() : undefined;
			await onBulkSubmit(codes, selectedType, expiresAt);
			setBulkCodes("");
		} else {
			if (!code.trim()) return;
			const expiresAt = expirationDate ? expirationDate.toISOString() : undefined;
			await onSubmit({ code: code.trim(), type: selectedType, expiresAt: expiresAt });
			setCode("");
		}

		setExpirationDate(undefined);

		onToggle(); // Close the form
	};

	const handleImportFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setBulkCodes(text);
			setIsBulkMode(true);
		} catch (err) {
			console.error("Failed to read clipboard:", err);
		}
	};

	if (!isOpen) {
		return (
			<Button onClick={onToggle} className="w-full" variant="outline">
				<Plus className="h-4 w-4 mr-2" />
				Add New Coupon
			</Button>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg">Add New Coupon</CardTitle>
				<Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
					<X className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex gap-2">
					<Button
						type="button"
						variant={!isBulkMode ? "default" : "outline"}
						size="sm"
						onClick={() => setIsBulkMode(false)}
					>
						Single Coupon
					</Button>
					<Button
						type="button"
						variant={isBulkMode ? "default" : "outline"}
						size="sm"
						onClick={() => setIsBulkMode(true)}
					>
						Bulk Import
					</Button>
					{isBulkMode && (
						<Button type="button" variant="outline" size="sm" onClick={handleImportFromClipboard}>
							<Clipboard className="h-4 w-4 mr-2" />
							From Clipboard
						</Button>
					)}
				</div>

				{/* Coupon Type Selector */}
				<div className="space-y-2">
					<Label>Coupon Type</Label>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="w-full justify-between">
								<span className="capitalize">{selectedType}</span>
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[8rem]">
							<DropdownMenuItem onClick={() => setSelectedType("food")}>🍜 Food</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSelectedType("ride")}>🚗 Ride</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Expiration Date */}
				<div className="space-y-2">
					<Label>Expiration Date (optional)</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"w-full justify-start text-left font-normal",
									!expirationDate && "text-muted-foreground",
								)}
								disabled={isSubmitting}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={expirationDate}
								onSelect={setExpirationDate}
								disabled={(date) => date < new Date()}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
					{isBulkMode && (
						<p className="text-sm text-muted-foreground">
							This expiration date will be applied to all coupons in the bulk import.
						</p>
					)}
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{isBulkMode ? (
						<div className="space-y-2">
							<Label htmlFor="bulkCodes">Coupon Codes (one per line) *</Label>
							<Textarea
								id="bulkCodes"
								placeholder="Enter coupon codes, one per line...\nCODE1\nCODE2\nCODE3"
								value={bulkCodes}
								onChange={(e) => setBulkCodes(e.target.value)}
								disabled={isSubmitting}
								rows={6}
							/>
							{bulkCodes && (
								<p className="text-sm text-muted-foreground">
									{bulkCodes.split("\n").filter((code) => code.trim().length > 0).length} codes
									ready to import
								</p>
							)}
						</div>
					) : (
						<div className="space-y-2">
							<Label htmlFor="code">Coupon Code *</Label>
							<Input
								id="code"
								type="text"
								placeholder="Enter coupon code..."
								value={code}
								onChange={(e) => setCode(e.target.value)}
								disabled={isSubmitting}
								required
								maxLength={100}
							/>
						</div>
					)}
					<div className="flex gap-2">
						<Button
							type="submit"
							disabled={
								isSubmitting ||
								(isBulkMode ? !bulkCodes.trim() : !code.trim()) ||
								(isBulkMode && !onBulkSubmit)
							}
						>
							{isSubmitting ? "Adding..." : isBulkMode ? "Import Coupons" : "Add Coupon"}
						</Button>
						<Button type="button" variant="outline" onClick={onToggle}>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
