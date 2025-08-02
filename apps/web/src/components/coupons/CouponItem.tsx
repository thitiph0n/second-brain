import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, CheckCircle, Circle } from 'lucide-react';
import type { Coupon } from '@/types/coupon';

interface CouponItemProps {
  coupon: Coupon;
  onToggleUsed: (id: string, isUsed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
}

export function CouponItem({ coupon, onToggleUsed, onDelete, isUpdating = false }: CouponItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleToggleUsed = () => {
    onToggleUsed(coupon.id, !coupon.is_used);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(coupon.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <Card className={`transition-all duration-200 ${coupon.is_used ? 'opacity-70' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mt-1"
              onClick={handleToggleUsed}
              disabled={isUpdating}
            >
              {coupon.is_used ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className={`text-sm font-mono font-medium break-all ${
                  coupon.is_used ? 'line-through text-muted-foreground' : ''
                }`}>
                  {coupon.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyCode}
                  title="Copy code"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {coupon.is_used && (
                  <Badge variant="secondary" className="text-xs">
                    Used
                  </Badge>
                )}
              </div>
              
              
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Created: {formatDate(coupon.created_at)}</span>
                {coupon.is_used && coupon.used_at && (
                  <span>Used: {formatDate(coupon.used_at)}</span>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${showDeleteConfirm ? 'text-red-600 bg-red-50' : ''}`}
            onClick={handleDelete}
            disabled={isUpdating}
            title={showDeleteConfirm ? 'Click again to confirm' : 'Delete coupon'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
