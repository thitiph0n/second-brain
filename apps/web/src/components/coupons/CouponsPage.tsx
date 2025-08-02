import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Loader2 } from 'lucide-react';
import { CouponForm } from './CouponForm';
import { CouponList } from './CouponList';
import { couponApi, ApiError } from '@/services/couponApi';
import type { Coupon, CreateCouponRequest } from '@/types/coupon';

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load coupons on component mount
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setError(null);
      const response = await couponApi.getCoupons();
      setCoupons(response.coupons);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (data: CreateCouponRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await couponApi.createCoupon(data);
      setCoupons(prev => [response.coupon, ...prev]);
    } catch (err) {
      console.error('Failed to create coupon:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to create coupon');
      throw err; // Re-throw to prevent form from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreateCoupons = async (codes: string[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create all coupons in parallel
      const promises = codes.map(code => couponApi.createCoupon({ code }));
      const responses = await Promise.all(promises);
      
      // Add all new coupons to the list
      const newCoupons = responses.map(response => response.coupon);
      setCoupons(prev => [...newCoupons, ...prev]);
    } catch (err) {
      console.error('Failed to create coupons:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to create some coupons');
      throw err; // Re-throw to prevent form from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUsed = async (id: string, isUsed: boolean) => {
    try {
      setIsUpdating(true);
      setError(null);
      const response = await couponApi.updateCoupon(id, { is_used: isUsed });
      setCoupons(prev => 
        prev.map(coupon => 
          coupon.id === id ? response.coupon : coupon
        )
      );
    } catch (err) {
      console.error('Failed to update coupon:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to update coupon');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      await couponApi.deleteCoupon(id);
      setCoupons(prev => prev.filter(coupon => coupon.id !== id));
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to delete coupon');
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCoupons = coupons.filter(c => !c.is_used);
  const usedCoupons = coupons.filter(c => c.is_used);

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
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-red-700">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
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
                <div className="flex gap-2">
                  <Badge variant="outline">{activeCoupons.length} Active</Badge>
                  <Badge variant="secondary">{usedCoupons.length} Used</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({coupons.length})</TabsTrigger>
                  <TabsTrigger value="active">Active ({activeCoupons.length})</TabsTrigger>
                  <TabsTrigger value="used">Used ({usedCoupons.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <CouponList
                    coupons={coupons}
                    onToggleUsed={handleToggleUsed}
                    onDelete={handleDeleteCoupon}
                    isUpdating={isUpdating}
                    filter="all"
                  />
                </TabsContent>
                
                <TabsContent value="active" className="mt-4">
                  <CouponList
                    coupons={coupons}
                    onToggleUsed={handleToggleUsed}
                    onDelete={handleDeleteCoupon}
                    isUpdating={isUpdating}
                    filter="active"
                  />
                </TabsContent>
                
                <TabsContent value="used" className="mt-4">
                  <CouponList
                    coupons={coupons}
                    onToggleUsed={handleToggleUsed}
                    onDelete={handleDeleteCoupon}
                    isUpdating={isUpdating}
                    filter="used"
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
