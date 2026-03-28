-- Corregir valores inconsistentes en saved_shifts donde has_break debería ser true
UPDATE saved_shifts 
SET has_break = true
WHERE has_break = false 
  AND (
    (total_break_time IS NOT NULL AND total_break_time > 0) 
    OR 
    (break_duration IS NOT NULL AND break_duration != '0' AND break_duration != '')
  );