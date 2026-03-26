-- Habilitar extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar envío de notificaciones diario a las 9:00 AM
SELECT cron.schedule(
  'send-deletion-warnings-daily',
  '0 9 * * *', -- todos los días a las 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://povgwdbnyqdcygedcijl.supabase.co/functions/v1/send-deletion-warning',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdmd3ZGJueXFkY3lnZWRjaWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQwNDMsImV4cCI6MjA3MDg2MDA0M30.BenN3RySFIVuW9E2dfN2VpD5D7hFIyUkrvcARBj93Y8"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);

-- Programar limpieza de usuarios expirados diario a las 2:00 AM
SELECT cron.schedule(
  'cleanup-expired-users-daily',
  '0 2 * * *', -- todos los días a las 2:00 AM
  $$
  SELECT net.http_post(
    url := 'https://povgwdbnyqdcygedcijl.supabase.co/functions/v1/cleanup-deleted-users',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdmd3ZGJueXFkY3lnZWRjaWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQwNDMsImV4cCI6MjA3MDg2MDA0M30.BenN3RySFIVuW9E2dfN2VpD5D7hFIyUkrvcARBj93Y8"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);