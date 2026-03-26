-- Create absence requests table
CREATE TABLE public.absence_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_comment TEXT,
  submitted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_date TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for absence requests
CREATE POLICY "Admins can manage all absence requests" 
ON public.absence_requests 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Colaboradores can view their own absence requests" 
ON public.absence_requests 
FOR SELECT 
USING (colaborador_id IN (
  SELECT c.id
  FROM colaboradores c
  JOIN profiles p ON p.email = c.email
  WHERE p.id = auth.uid() AND p.deleted_at IS NULL
));

CREATE POLICY "Colaboradores can create their own absence requests" 
ON public.absence_requests 
FOR INSERT 
WITH CHECK (colaborador_id IN (
  SELECT c.id
  FROM colaboradores c
  JOIN profiles p ON p.email = c.email
  WHERE p.id = auth.uid() AND p.deleted_at IS NULL
));

CREATE POLICY "Colaboradores can update their pending absence requests" 
ON public.absence_requests 
FOR UPDATE 
USING (
  colaborador_id IN (
    SELECT c.id
    FROM colaboradores c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND p.deleted_at IS NULL
  )
  AND status = 'pending'
)
WITH CHECK (
  colaborador_id IN (
    SELECT c.id
    FROM colaboradores c
    JOIN profiles p ON p.email = c.email
    WHERE p.id = auth.uid() AND p.deleted_at IS NULL
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_absence_requests_updated_at
BEFORE UPDATE ON public.absence_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_absence_requests_colaborador_id ON public.absence_requests(colaborador_id);
CREATE INDEX idx_absence_requests_status ON public.absence_requests(status);
CREATE INDEX idx_absence_requests_dates ON public.absence_requests(start_date, end_date);