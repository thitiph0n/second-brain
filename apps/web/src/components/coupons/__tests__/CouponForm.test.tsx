import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CouponForm } from "@/components/coupons/CouponForm";

describe("CouponForm", () => {
	const mockOnSubmit = vi.fn();
	const mockOnToggle = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders add button when closed", () => {
		render(<CouponForm onSubmit={mockOnSubmit} isOpen={false} onToggle={mockOnToggle} />);

		expect(screen.getByText("Add New Coupon")).toBeInTheDocument();
	});

	it("renders form when open", () => {
		render(<CouponForm onSubmit={mockOnSubmit} isOpen={true} onToggle={mockOnToggle} />);

		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/coupon type/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /add coupon/i })).toBeInTheDocument();
	});

	it("submits form with correct data", async () => {
		mockOnSubmit.mockResolvedValue(undefined);

		render(<CouponForm onSubmit={mockOnSubmit} isOpen={true} onToggle={mockOnToggle} />);

		const codeInput = screen.getByLabelText(/coupon code/i);
		const submitButton = screen.getByRole("button", { name: /add coupon/i });

		fireEvent.change(codeInput, { target: { value: "SAVE20" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith({
				code: "SAVE20",
				type: "food",
				expires_at: undefined,
			});
		});
	});

	it("resets form after successful submission", async () => {
		mockOnSubmit.mockResolvedValue(undefined);

		render(<CouponForm onSubmit={mockOnSubmit} isOpen={true} onToggle={mockOnToggle} />);

		const codeInput = screen.getByLabelText(/coupon code/i);
		const submitButton = screen.getByRole("button", { name: /add coupon/i });

		fireEvent.change(codeInput, { target: { value: "TEST" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnToggle).toHaveBeenCalled();
		});
	});
});
