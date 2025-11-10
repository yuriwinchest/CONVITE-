-- Add check-in timestamp column to guests table
ALTER TABLE public.guests 
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for performance on check-in queries
CREATE INDEX idx_guests_checked_in_at ON public.guests(checked_in_at) WHERE checked_in_at IS NOT NULL;

-- Add index on qr_code for fast lookups during scanning
CREATE INDEX idx_guests_qr_code ON public.guests(qr_code) WHERE qr_code IS NOT NULL;