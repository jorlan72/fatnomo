import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutActivity {
  id: string;
  activity: string;
  reps: number | null;
  sets: number | null;
  current_weight: number | null;
  times_per_week: number | null;
  calories: number | null;
}

export const useWorkoutStats = () => {
  const [totalWeeklyCalories, setTotalWeeklyCalories] = useState(0);
  const [activities, setActivities] = useState<WorkoutActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("workout_activities")
        .select("*")
        .eq("user_id", session.user.id);

      if (!error && data) {
        setActivities(data);
        const total = data.reduce((sum, activity) => {
          return sum + ((activity.calories || 0) * (activity.times_per_week || 0));
        }, 0);
        setTotalWeeklyCalories(total);
      }
      
      setLoading(false);
    };

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      // Subscribe to changes in workout_activities for current user
      const channel = supabase
        .channel('workout-stats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workout_activities',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

      return channel;
    };

    fetchActivities();
    const channelPromise = setupSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

  return { totalWeeklyCalories, activities, loading };
};
