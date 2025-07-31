import type { Coupon } from '@/types/coupon';
import { CouponItem } from './CouponItem';

interface CouponListProps {
  coupons: Coupon[];
  onToggleUsed: (id: string, isUsed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  filter?: 'all' | 'active' | 'used';
}

export function CouponList({ 
  coupons, 
  onToggleUsed, 
  onDelete, 
  isUpdating = false,
  filter = 'all'
}: CouponListProps) {
  // Filter coupons based on the filter prop
  const filteredCoupons = coupons.filter(coupon => {
    if (filter === 'active') return !coupon.is_used;
    if (filter === 'used') return coupon.is_used;
    return true; // 'all'
  });

  if (filteredCoupons.length === 0) {
    const message = filter === 'active' 
      ? 'No active coupons found'
      : filter === 'used' 
        ? 'No used coupons found'
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
        />
      ))}
    </div>
  );
}
