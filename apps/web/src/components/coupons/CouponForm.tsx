import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import type { CreateCouponRequest } from '@/types/coupon';

interface CouponFormProps {
  onSubmit: (data: CreateCouponRequest) => Promise<void>;
  isSubmitting?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function CouponForm({ onSubmit, isSubmitting = false, isOpen, onToggle }: CouponFormProps) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) return;

    await onSubmit({ 
      code: code.trim(), 
      description: description.trim() || undefined 
    });

    // Reset form
    setCode('');
    setDescription('');
    onToggle(); // Close the form
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this coupon..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !code.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Coupon'}
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