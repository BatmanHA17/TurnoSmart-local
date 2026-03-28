-- Create table for email verification codes
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for verification codes (public access for verification process)
CREATE POLICY "Anyone can create verification codes" 
ON public.verification_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes for verification" 
ON public.verification_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update verification codes for verification" 
ON public.verification_codes 
FOR UPDATE 
USING (true);

-- Create index for email lookups
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);

-- Create function to cleanup expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() AND verified_at IS NULL;
END;
$$;