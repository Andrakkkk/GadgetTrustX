-- Migration: Add location (seller city) column to devices table
-- Existing products without location will default to 'Jakarta'

ALTER TABLE devices ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Jakarta';

-- Update any NULL values just in case
UPDATE devices SET location = 'Jakarta' WHERE location IS NULL OR location = '';
