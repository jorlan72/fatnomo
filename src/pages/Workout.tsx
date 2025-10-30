import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutActivity {
  id: string;
  activity: string;
  reps: number | null;
  sets: number | null;
  current_weight: number | null;
  times_per_week: number | null;
}

const Workout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<WorkoutActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchActivities(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchActivities(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
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
      id: crypto.randomUUID(),
      activity: "",
      reps: null,
      sets: null,
      current_weight: null,
      times_per_week: null,
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

    const activitiesToUpsert = activities.map(({ id, ...rest }) => ({
      id,
      ...rest,
      user_id: user.id,
    }));

    const { error } = await supabase
      .from("workout_activities")
      .upsert(activitiesToUpsert);

    if (error) {
      toast({
        title: "Error saving activities",
        description: error.message,
        variant: "destructive",
      });
    } else {
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
            <h1 className="text-2xl font-bold">Workout Tracker</h1>
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
            <CardTitle>Workout Activities</CardTitle>
            <CardDescription>Track your workout exercises, reps, sets, and weights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Reps</TableHead>
                      <TableHead>Sets</TableHead>
                      <TableHead>Current Weight (kg)</TableHead>
                      <TableHead>Times per week</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={activity.reps ?? ""}
                              onChange={(e) => handleChange(activity.id, "reps", e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={activity.sets ?? ""}
                              onChange={(e) => handleChange(activity.id, "sets", e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={activity.current_weight ?? ""}
                              onChange={(e) => handleChange(activity.id, "current_weight", e.target.value)}
                              placeholder="0.0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={activity.times_per_week ?? ""}
                              onChange={(e) => handleChange(activity.id, "times_per_week", e.target.value)}
                              placeholder="0"
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

              <div className="flex gap-2">
                <Button onClick={handleAddRow} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
                <Button onClick={handleSave} disabled={saving}>
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
