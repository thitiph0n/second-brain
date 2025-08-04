import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, X, Clipboard, ChevronDown } from 'lucide-react';
import type { CreateCouponRequest, CouponType } from '@/types/coupon';

interface CouponFormProps {
  onSubmit: (data: CreateCouponRequest) => Promise<void>;
  onBulkSubmit?: (codes: string[], type: CouponType, expiresAt?: string) => Promise<void>;
  isSubmitting?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function CouponForm({ onSubmit, onBulkSubmit, isSubmitting = false, isOpen, onToggle }: CouponFormProps) {
  const [code, setCode] = useState('');
  const [bulkCodes, setBulkCodes] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedType, setSelectedType] = useState<CouponType>('food');
  const [expirationDate, setExpirationDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBulkMode) {
      if (!bulkCodes.trim() || !onBulkSubmit) return;
      
      const codes = bulkCodes
        .split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0);
        
      if (codes.length === 0) return;
      
      const expiresAt = expirationDate ? new Date(expirationDate).toISOString() : undefined;
      await onBulkSubmit(codes, selectedType, expiresAt);
      setBulkCodes('');
    } else {
      if (!code.trim()) return;
      const expiresAt = expirationDate ? new Date(expirationDate).toISOString() : undefined;
      await onSubmit({ code: code.trim(), type: selectedType, expires_at: expiresAt });
      setCode('');
    }
    
    setExpirationDate('');
    
    onToggle(); // Close the form
  };

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setBulkCodes(text);
      setIsBulkMode(true);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
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
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            variant={!isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBulkMode(false)}
          >
            Single Coupon
          </Button>
          <Button
            type="button"
            variant={isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBulkMode(true)}
          >
            Bulk Import
          </Button>
          {isBulkMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportFromClipboard}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              From Clipboard
            </Button>
          )}
        </div>

        {/* Coupon Type Selector */}
        <div className="space-y-2">
          <Label>Coupon Type</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="capitalize">{selectedType}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => setSelectedType('food')}>
                🍜 Food
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('ride')}>
                🚗 Ride
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Expiration Date (optional)</Label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={isSubmitting}
          />
          {isBulkMode && (
            <p className="text-sm text-muted-foreground">
              This expiration date will be applied to all coupons in the bulk import.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isBulkMode ? (
            <div className="space-y-2">
              <Label htmlFor="bulkCodes">Coupon Codes (one per line) *</Label>
              <Textarea
                id="bulkCodes"
                placeholder="Enter coupon codes, one per line...\nCODE1\nCODE2\nCODE3"
                value={bulkCodes}
                onChange={(e) => setBulkCodes(e.target.value)}
                disabled={isSubmitting}
                rows={6}
              />
              {bulkCodes && (
                <p className="text-sm text-muted-foreground">
                  {bulkCodes.split('\n').filter(code => code.trim().length > 0).length} codes ready to import
                </p>
              )}
            </div>
          ) : (
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
          )}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || (isBulkMode ? !bulkCodes.trim() : !code.trim()) || (isBulkMode && !onBulkSubmit)}
            >
              {isSubmitting ? 'Adding...' : (isBulkMode ? 'Import Coupons' : 'Add Coupon')}
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
