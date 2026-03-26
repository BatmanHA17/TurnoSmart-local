-- Increase precision for occupancy_percentage to avoid numeric overflow when storing values like 115.00%
ALTER TABLE public.daily_occupancy
ALTER COLUMN occupancy_percentage TYPE numeric(6,2)
USING ROUND(occupancy_percentage::numeric, 2);

-- Optional: ensure values are non-negative (kept implicit by application logic).