import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouponForm } from '@/components/coupons/CouponForm';

describe('CouponForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add button when closed', () => {
    render(
      <CouponForm
        onSubmit={mockOnSubmit}
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Add New Coupon')).toBeInTheDocument();
  });

  it('renders form when open', () => {
    render(
      <CouponForm
        onSubmit={mockOnSubmit}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add coupon/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CouponForm
        onSubmit={mockOnSubmit}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const codeInput = screen.getByLabelText(/coupon code/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /add coupon/i });

    fireEvent.change(codeInput, { target: { value: 'SAVE20' } });
    fireEvent.change(descriptionInput, { target: { value: '20% off coupon' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        code: 'SAVE20',
        description: '20% off coupon',
      });
    });
  });

  it('resets form after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CouponForm
        onSubmit={mockOnSubmit}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const codeInput = screen.getByLabelText(/coupon code/i);
    const submitButton = screen.getByRole('button', { name: /add coupon/i });

    fireEvent.change(codeInput, { target: { value: 'TEST' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });
});
