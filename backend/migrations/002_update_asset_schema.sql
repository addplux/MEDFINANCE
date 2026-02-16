-- Migration: Update Asset table schema
-- Date: 2026-02-16

-- Rename columns to match new model
ALTER TABLE assets RENAME COLUMN asset_code TO asset_tag;
ALTER TABLE assets RENAME COLUMN cost TO purchase_price;
ALTER TABLE assets RENAME COLUMN notes TO description;

-- Add new columns
ALTER TABLE assets ADD COLUMN IF NOT EXISTS annual_depreciation DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS supplier VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Modify bookValue to allow NULL
ALTER TABLE assets ALTER COLUMN book_value DROP NOT NULL;

-- Update existing records to calculate annual depreciation
UPDATE assets 
SET annual_depreciation = (purchase_price - salvage_value) / useful_life
WHERE annual_depreciation IS NULL OR annual_depreciation = 0;
