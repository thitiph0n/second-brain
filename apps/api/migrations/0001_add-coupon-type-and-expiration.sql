-- Migration: Add coupon type and expiration fields
-- Add type column with default value
ALTER TABLE coupons ADD COLUMN type TEXT NOT NULL DEFAULT 'food';

-- Add expires_at column
ALTER TABLE coupons ADD COLUMN expires_at DATETIME;

-- Add check constraint for type (SQLite supports CHECK constraints)
-- Note: We can't add CHECK constraints to existing tables in SQLite, so we'll rely on application validation

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);