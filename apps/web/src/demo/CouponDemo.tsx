import { useState } from 'react';
import { CouponItem } from '@/components/coupons/CouponItem';
import { CouponForm } from '@/components/coupons/CouponForm';
import type { Coupon } from '@/types/coupon';

const mockCoupons: Coupon[] = [
  {
    id: '1',
    userId: 'demo',
    code: 'NOODLE50',
    type: 'food',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isUsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    code: 'RIDE20',
    type: 'ride',
    isUsed: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    userId: 'demo',
    code: 'USED123',
    type: 'food',
    isUsed: true,
    usedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    userId: 'demo',
    code: 'EXPIRED',
    type: 'food',
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
    isUsed: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function CouponDemo() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [showForm, setShowForm] = useState(false);

  const handleToggleUsed = async (id: string, isUsed: boolean) => {
    setCoupons(prev => prev.map(coupon => 
      coupon.id === id 
        ? { ...coupon, isUsed: isUsed, usedAt: isUsed ? new Date().toISOString() : undefined }
        : coupon
    ));
  };

  const handleDelete = async (id: string) => {
    setCoupons(prev => prev.filter(coupon => coupon.id !== id));
  };

  const handleSubmit = async (data: any) => {
    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'demo',
      code: data.code,
      type: data.type,
      expiresAt: data.expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCoupons(prev => [newCoupon, ...prev]);
  };

  const handleBulkSubmit = async (codes: string[], type: any, expiresAt?: string) => {
    const newCoupons: Coupon[] = codes.map(code => ({
      id: Math.random().toString(36).substr(2, 9),
      userId: 'demo',
      code,
      type,
      expiresAt: expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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