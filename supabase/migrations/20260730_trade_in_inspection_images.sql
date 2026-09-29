-- ============================================================
-- Migration: Add inspection_images column to trade_in_requests
-- Purpose  : Seller uploads photos when receiving buyer's old device
-- Date     : 2026-07-30
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- STEP 1: Add column
ALTER TABLE trade_in_requests
  ADD COLUMN IF NOT EXISTS inspection_images TEXT[] DEFAULT '{}';

-- STEP 2: Seed different dummy inspection photo sets for existing
--         completed/shipping trade-ins (5 different sets, varied per row)
--         Uses a CTE with row_number() to assign per-row variant.
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM trade_in_requests
  WHERE status IN ('completed', 'shipping')
    AND (inspection_images IS NULL OR inspection_images = '{}')
)
UPDATE trade_in_requests t
SET inspection_images = CASE (n.rn % 5)
  WHEN 1 THEN ARRAY[
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'
  ]
  WHEN 2 THEN ARRAY[
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80'
  ]
  WHEN 3 THEN ARRAY[
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551355738-1875b786fa2d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592950630581-03cb41342cc5?auto=format&fit=crop&w=800&q=80'
  ]
  WHEN 4 THEN ARRAY[
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'
  ]
  ELSE ARRAY[
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80'
  ]
END
FROM numbered n
WHERE t.id = n.id;
