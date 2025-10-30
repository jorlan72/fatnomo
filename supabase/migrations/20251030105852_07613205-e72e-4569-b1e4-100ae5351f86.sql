-- Create reusable function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create week plan entries table
CREATE TABLE public.week_plan_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  time_slot TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, time_slot)
);

-- Enable Row Level Security
ALTER TABLE public.week_plan_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own week plan entries" 
ON public.week_plan_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own week plan entries" 
ON public.week_plan_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own week plan entries" 
ON public.week_plan_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own week plan entries" 
ON public.week_plan_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_week_plan_entries_updated_at
BEFORE UPDATE ON public.week_plan_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();