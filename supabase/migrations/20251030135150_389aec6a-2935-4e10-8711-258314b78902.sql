-- Create workout_activities table
CREATE TABLE public.workout_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity TEXT NOT NULL,
  reps INTEGER,
  sets INTEGER,
  current_weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own workout activities" 
ON public.workout_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout activities" 
ON public.workout_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout activities" 
ON public.workout_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout activities" 
ON public.workout_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workout_activities_updated_at
BEFORE UPDATE ON public.workout_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();