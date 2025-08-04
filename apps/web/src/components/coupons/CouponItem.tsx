import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExternalLink, Copy, CheckCircle, Circle, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon } from '@/types/coupon';

interface CouponItemProps {
  coupon: Coupon;
  onToggleUsed: (id: string, isUsed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
}

export function CouponItem({
  coupon,
  onToggleUsed,
  onDelete,
  isUpdating = false,
}: CouponItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success('Coupon code copied to clipboard!', {
        description: `Code: ${coupon.code}`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error('Failed to copy code', {
        description: 'Please try again or copy manually',
        duration: 3000,
      });
    }
  };

  const handleToggleUsed = () => {
    onToggleUsed(coupon.id, !coupon.is_used);
  };

  const handleApplyCoupon = async () => {
    const baseUrl = 'https://lineman.onelink.me/1N3T?af_dp=com.linecorp.linemanth://app/service';
    const deepLink = coupon.type === 'food' 
      ? `${baseUrl}/food?coupon=${encodeURIComponent(coupon.code)}`
      : `${baseUrl}/ride?coupon=${encodeURIComponent(coupon.code)}`;
    
    // Open the deep link
    window.open(deepLink, '_blank');
    
    // Mark coupon as used
    try {
      await onToggleUsed(coupon.id, true);
      toast.success('Coupon applied and marked as used!', {
        description: `${coupon.type} coupon: ${coupon.code}`,
        duration: 3000,
      });
    } catch {
      // Still show success for opening the app, but mention the marking failed
      toast.success('Opening Lineman app...', {
        description: `Applied ${coupon.type} coupon: ${coupon.code}`,
        duration: 3000,
      });
      toast.error('Could not mark coupon as used', {
        description: 'You may need to mark it manually',
        duration: 2000,
      });
    }
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

  const isExpired = Boolean(coupon.expires_at && new Date(coupon.expires_at) < new Date());
  const isExpiringSoon = Boolean(coupon.expires_at && !isExpired && 
    new Date(coupon.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000); // 24 hours

  return (
    <Card
      className={`transition-all duration-200 ${
        coupon.is_used ? 'opacity-70' : ''
      } ${
        isExpired ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''
      } ${
        isExpiringSoon ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : ''
      }`}
    >
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Left side: Checkbox and content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mt-1 flex-shrink-0"
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <code
                  className={`text-sm font-mono font-medium break-all ${
                    coupon.is_used ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {coupon.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={handleCopyCode}
                  title="Copy code"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge 
                  variant={coupon.type === 'food' ? 'default' : 'outline'} 
                  className="text-xs"
                >
                  {coupon.type === 'food' ? '🍜' : '🚗'} {coupon.type}
                </Badge>
                {isExpired && (
                  <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    Expired
                  </Badge>
                )}
                {isExpiringSoon && !isExpired && (
                  <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Expiring Soon
                  </Badge>
                )}
                {coupon.is_used && (
                  <Badge variant="secondary" className="text-xs">
                    Used
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Created: {formatDate(coupon.created_at)}</span>
                {coupon.expires_at && (
                  <span className={isExpired ? 'text-red-500 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : ''}>
                    Expires: {formatDate(coupon.expires_at)}
                  </span>
                )}
                {coupon.is_used && coupon.used_at && coupon.used_at !== '0' && coupon.used_at !== '' && (
                  <span>Used: {formatDate(coupon.used_at)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex flex-row items-start gap-2 flex-shrink-0 min-w-0">
            {/* Apply Coupon Button - Primary Action */}
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 sm:w-auto"
              onClick={handleApplyCoupon}
              disabled={isUpdating || isExpired || coupon.is_used}
              title={
                coupon.is_used ? 'Coupon already used' :
                isExpired ? 'Cannot apply expired coupon' : 
                `Apply ${coupon.type} coupon in Lineman`
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Apply
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600"
                  disabled={isUpdating}
                  title="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className={`text-red-600 hover:text-red-700 focus:text-red-700 ${
                    showDeleteConfirm ? 'bg-red-50 dark:bg-red-950' : ''
                  }`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {showDeleteConfirm ? 'Confirm' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
