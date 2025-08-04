import { useState } from 'react';
import { CouponItem } from '@/components/coupons/CouponItem';
import { CouponForm } from '@/components/coupons/CouponForm';
import type { Coupon } from '@/types/coupon';

const mockCoupons: Coupon[] = [
  {
    id: '1',
    user_id: 'demo',
    code: 'NOODLE50',
    type: 'food',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    is_used: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo',
    code: 'RIDE20',
    type: 'ride',
    is_used: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: 'demo',
    code: 'USED123',
    type: 'food',
    is_used: true,
    used_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: 'demo',
    code: 'EXPIRED',
    type: 'food',
    expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
    is_used: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function CouponDemo() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [showForm, setShowForm] = useState(false);

  const handleToggleUsed = async (id: string, isUsed: boolean) => {
    setCoupons(prev => prev.map(coupon => 
      coupon.id === id 
        ? { ...coupon, is_used: isUsed, used_at: isUsed ? new Date().toISOString() : undefined }
        : coupon
    ));
  };

  const handleDelete = async (id: string) => {
    setCoupons(prev => prev.filter(coupon => coupon.id !== id));
  };

  const handleSubmit = async (data: any) => {
    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'demo',
      code: data.code,
      type: data.type,
      expires_at: data.expires_at,
      is_used: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCoupons(prev => [newCoupon, ...prev]);
  };

  const handleBulkSubmit = async (codes: string[], type: any, expiresAt?: string) => {
    const newCoupons: Coupon[] = codes.map(code => ({
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'demo',
      code,
      type,
      expires_at: expiresAt,
      is_used: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    setCoupons(prev => [...newCoupons, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🍜 Coupon Book Demo</h1>
        <p className="text-muted-foreground">
          Demo showing the improved UI for mobile devices, bulk expiration support, and noodle icons
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

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Sample Coupons</h2>
          {coupons.map((coupon) => (
            <CouponItem
              key={coupon.id}
              coupon={coupon}
              onToggleUsed={handleToggleUsed}
              onDelete={handleDelete}
              isUpdating={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}