-- Create weight_entries table
CREATE TABLE public.weight_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own weight entries"
ON public.weight_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weight entries"
ON public.weight_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries"
ON public.weight_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries"
ON public.weight_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_weight_entries_user_date ON public.weight_entries(user_id, entry_date DESC);