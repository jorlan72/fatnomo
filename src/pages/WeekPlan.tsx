import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";
import { User } from "@supabase/supabase-js";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface WeekPlanEntry {
  day_of_week: string;
  time_slot: string;
  content: string;
}

const WeekPlan = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<Record<string, Record<string, string>>>({});
  const currentDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Convert Sunday=0 to Sunday=6

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadUserTheme();
      loadWeekPlanEntries();
    }
  }, [user]);

  const loadUserTheme = async () => {
    const { data } = await supabase.from("profiles").select("theme").eq("user_id", user?.id).maybeSingle();

    if (data?.theme) {
      setTheme(data.theme);
    }
  };

  const loadWeekPlanEntries = async () => {
    const { data, error } = await supabase
      .from("week_plan_entries")
      .select("day_of_week, time_slot, content")
      .eq("user_id", user?.id);

    if (error) {
      console.error("Error loading week plan entries:", error);
      return;
    }

    const entriesMap: Record<string, Record<string, string>> = {};
    
    DAYS.forEach((day) => {
      entriesMap[day.toLowerCase()] = {};
    });

    data?.forEach((entry: WeekPlanEntry) => {
      if (!entriesMap[entry.day_of_week]) {
        entriesMap[entry.day_of_week] = {};
      }
      entriesMap[entry.day_of_week][entry.time_slot] = entry.content;
    });

    setEntries(entriesMap);
  };

  const handleThemeChange = async (theme: string) => {
    if (!user) return;

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();

    if (existingProfile) {
      await supabase.from("profiles").update({ theme }).eq("user_id", user.id);
    } else {
      await supabase.from("profiles").insert({ user_id: user.id, theme });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleCellBlur = async (day: string, timeSlot: string, content: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("week_plan_entries")
      .upsert(
        {
          user_id: user.id,
          day_of_week: day.toLowerCase(),
          time_slot: timeSlot,
          content: content.trim(),
        },
        {
          onConflict: "user_id,day_of_week,time_slot",
        }
      );

    if (error) {
      console.error("Error saving week plan entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCellChange = (day: string, timeSlot: string, content: string) => {
    setEntries((prev) => ({
      ...prev,
      [day.toLowerCase()]: {
        ...prev[day.toLowerCase()],
        [timeSlot]: content,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Week Plan
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle onThemeChange={handleThemeChange} />
            <Button
              onClick={handleLogout}
              variant="outline"
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
            >
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-20">
                <TableRow>
                  <TableHead className="w-24 sticky left-0 bg-card z-10">Time</TableHead>
                  {DAYS.map((day) => (
                    <TableHead 
                      key={day} 
                      className={`min-w-32 text-center ${day === currentDay ? 'bg-primary/10' : ''}`}
                    >
                      {day}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIME_SLOTS.map((timeSlot) => (
                  <TableRow key={timeSlot}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 text-xs">
                      {timeSlot}
                    </TableCell>
                    {DAYS.map((day) => (
                      <TableCell key={`${day}-${timeSlot}`} className={`p-0 align-top ${day === currentDay ? 'bg-primary/5' : ''}`}>
                        <textarea
                          className="w-full min-h-[48px] px-2 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset text-sm resize-none"
                          value={entries[day.toLowerCase()]?.[timeSlot] || ""}
                          onChange={(e) => handleCellChange(day, timeSlot, e.target.value)}
                          onBlur={(e) => handleCellBlur(day, timeSlot, e.target.value)}
                          placeholder=""
                          rows={2}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </main>
    </div>
  );
};

export default WeekPlan;
