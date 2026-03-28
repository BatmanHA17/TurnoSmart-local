-- Create saved_shifts table for persistent storage
CREATE TABLE public.saved_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  color text NOT NULL DEFAULT '#86efac',
  access_type text NOT NULL DEFAULT 'company',
  selected_team text,
  selected_workplace text,
  department text,
  organization text,
  is_additional_time boolean NOT NULL DEFAULT false,
  break_type text,
  break_duration text,
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view saved shifts"
ON public.saved_shifts
FOR SELECT
USING (true);

CREATE POLICY "Users can create saved shifts"
ON public.saved_shifts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update saved shifts"
ON public.saved_shifts
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete saved shifts"
ON public.saved_shifts
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_shifts_updated_at
BEFORE UPDATE ON public.saved_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shifts to ensure they're always available
INSERT INTO public.saved_shifts (name, start_time, end_time, color, access_type, department, organization, is_additional_time, break_type, break_duration, notes) VALUES
('Turno Mañana', '08:00', '16:00', '#86efac', 'company', 'Bares', 'Hotel', false, 'meal', '30', 'Turno de mañana estándar'),
('Turno Tarde', '16:00', '00:00', '#fbbf24', 'company', 'Bares', 'Hotel', false, 'meal', '30', 'Turno de tarde estándar'),
('Turno Noche', '00:00', '08:00', '#a78bfa', 'company', 'Bares', 'Hotel', false, 'meal', '30', 'Turno nocturno');