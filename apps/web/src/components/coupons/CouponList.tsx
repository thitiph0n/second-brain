import type { Coupon } from '@/types/coupon';
import { CouponItem } from './CouponItem';

interface CouponListProps {
  coupons: Coupon[];
  onToggleUsed: (id: string, isUsed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  filter?: 'all' | 'active' | 'used';
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export function CouponList({ 
  coupons, 
  onToggleUsed, 
  onDelete, 
  isUpdating = false,
  filter = 'all',
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: CouponListProps) {
  // Filter coupons based on the filter prop
  const filteredCoupons = coupons.filter(coupon => {
    if (filter === 'active') return !coupon.isUsed && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date());
    if (filter === 'used') return coupon.isUsed || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date());
    return true; // 'all'
  });

  if (filteredCoupons.length === 0) {
    const message = filter === 'active' 
      ? 'No active coupons found'
      : filter === 'used' 
        ? 'No used or expired coupons found'
        : 'No coupons found';

    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{message}</p>
        {filter === 'all' && (
          <p className="text-sm mt-2">Add your first coupon to get started!</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCoupons.map((coupon) => (
        <CouponItem
          key={coupon.id}
          coupon={coupon}
          onToggleUsed={onToggleUsed}
          onDelete={onDelete}
          isUpdating={isUpdating}
          selectionMode={selectionMode}
          isSelected={selectedIds.has(coupon.id)}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
}
