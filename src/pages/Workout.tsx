import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutStats } from "@/hooks/use-workout-stats";

interface WorkoutActivity {
  id: string;
  activity: string;
  reps: number | null;
  sets: number | null;
  current_weight: number | null;
  times_per_week: number | null;
  calories: number | null;
}

const Workout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { totalWeeklyCalories } = useWorkoutStats();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<WorkoutActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let realtimeChannel: any;

    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        fetchActivities(session.user.id);

        // Subscribe to realtime changes for this user's activities
        realtimeChannel = supabase
          .channel('workout-activities-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workout_activities',
              filter: `user_id=eq.${session.user.id}`
            },
            () => {
              fetchActivities(session.user.id);
            }
          )
          .subscribe();
      } else {
        navigate("/auth");
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchActivities(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [navigate]);

  const fetchActivities = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading activities",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const handleAddRow = () => {
    const newActivity: WorkoutActivity = {
      id: `temp-${Date.now()}`, // Temporary ID for new activities
      activity: "",
      reps: null,
      sets: null,
      current_weight: null,
      times_per_week: null,
      calories: null,
    };
    setActivities([...activities, newActivity]);
  };

  const handleChange = (id: string, field: keyof WorkoutActivity, value: string) => {
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        if (field === "activity") {
          return { ...activity, [field]: value };
        } else {
          const numValue = value === "" ? null : Number(value);
          return { ...activity, [field]: numValue };
        }
      }
      return activity;
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    // Separate new and existing activities
    const newActivities = activities
      .filter(a => a.id.startsWith('temp-'))
      .map(({ id, ...rest }) => ({
        ...rest,
        user_id: user.id,
      }));

    const existingActivities = activities
      .filter(a => !a.id.startsWith('temp-'))
      .map(({ id, ...rest }) => ({
        id,
        ...rest,
        user_id: user.id,
      }));

    let hasError = false;

    // Insert new activities
    if (newActivities.length > 0) {
      const { error } = await supabase
        .from("workout_activities")
        .insert(newActivities);

      if (error) {
        toast({
          title: "Error saving new activities",
          description: error.message,
          variant: "destructive",
        });
        hasError = true;
      }
    }

    // Update existing activities
    if (existingActivities.length > 0 && !hasError) {
      const { error } = await supabase
        .from("workout_activities")
        .upsert(existingActivities);

      if (error) {
        toast({
          title: "Error updating activities",
          description: error.message,
          variant: "destructive",
        });
        hasError = true;
      }
    }

    if (!hasError) {
      toast({
        title: "Success",
        description: "Workout activities saved successfully",
      });
      fetchActivities(user.id);
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("workout_activities")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting activity",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      setActivities(activities.filter(a => a.id !== id));
    }
    setDeleteId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Workout Activities</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle onThemeChange={() => {}} />
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Activities</CardTitle>
                <CardDescription>Track your workout routine and progress</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Calories/Week</div>
                <div className="text-2xl font-bold">
                  {totalWeeklyCalories.toLocaleString()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Desktop Table View */}
              <ScrollArea className="w-full rounded-md border hidden md:block">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Activity</TableHead>
                        <TableHead className="min-w-[100px]">Reps</TableHead>
                        <TableHead className="min-w-[100px]">Sets</TableHead>
                        <TableHead className="min-w-[140px]">Current Weight (kg)</TableHead>
                        <TableHead className="min-w-[100px]">Calories</TableHead>
                        <TableHead className="min-w-[130px]">Times per week</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No activities yet. Click "Add Activity" to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <Input
                                value={activity.activity}
                                onChange={(e) => handleChange(activity.id, "activity", e.target.value)}
                                placeholder="Exercise name"
                                className="min-w-[160px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={activity.reps ?? ""}
                                onChange={(e) => handleChange(activity.id, "reps", e.target.value)}
                                placeholder="0"
                                className="w-[80px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={activity.sets ?? ""}
                                onChange={(e) => handleChange(activity.id, "sets", e.target.value)}
                                placeholder="0"
                                className="w-[80px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={activity.current_weight ?? ""}
                                onChange={(e) => handleChange(activity.id, "current_weight", e.target.value)}
                                placeholder="0.0"
                                className="w-[100px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={activity.calories ?? ""}
                                onChange={(e) => handleChange(activity.id, "calories", e.target.value)}
                                placeholder="0"
                                className="w-[80px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={activity.times_per_week ?? ""}
                                onChange={(e) => handleChange(activity.id, "times_per_week", e.target.value)}
                                placeholder="0"
                                className="w-[100px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(activity.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Mobile Carousel View */}
              <div className="md:hidden">
                {activities.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No activities yet. Click "Add Activity" to get started.
                  </div>
                ) : (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {activities.map((activity) => (
                        <CarouselItem key={activity.id}>
                          <Card>
                            <CardContent className="p-6 space-y-4">
                              <div className="space-y-2">
                                <Label>Activity</Label>
                                <Input
                                  value={activity.activity}
                                  onChange={(e) => handleChange(activity.id, "activity", e.target.value)}
                                  placeholder="Exercise name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Reps</Label>
                                <Input
                                  type="number"
                                  value={activity.reps ?? ""}
                                  onChange={(e) => handleChange(activity.id, "reps", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Sets</Label>
                                <Input
                                  type="number"
                                  value={activity.sets ?? ""}
                                  onChange={(e) => handleChange(activity.id, "sets", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Current Weight (kg)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={activity.current_weight ?? ""}
                                  onChange={(e) => handleChange(activity.id, "current_weight", e.target.value)}
                                  placeholder="0.0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Calories</Label>
                                <Input
                                  type="number"
                                  value={activity.calories ?? ""}
                                  onChange={(e) => handleChange(activity.id, "calories", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Times per week</Label>
                                <Input
                                  type="number"
                                  value={activity.times_per_week ?? ""}
                                  onChange={(e) => handleChange(activity.id, "times_per_week", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteId(activity.id)}
                                className="w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Activity
                              </Button>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAddRow} variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workout activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Workout;
