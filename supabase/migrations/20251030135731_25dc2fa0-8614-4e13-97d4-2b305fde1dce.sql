-- Add times_per_week column to workout_activities table
ALTER TABLE public.workout_activities 
ADD COLUMN times_per_week INTEGER;