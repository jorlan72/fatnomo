import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";
import { User } from "@supabase/supabase-js";
import { Scale, Calendar } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    }
  }, [user]);

  const loadUserTheme = async () => {
    const { data } = await supabase.from("profiles").select("theme").eq("user_id", user?.id).maybeSingle();

    if (data?.theme) {
      setTheme(data.theme);
    }
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            BITREGN.NO
          </h1>
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

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              FatNoMo
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Don't Be A Fat Fuck</p>
          </div>

          <div className="grid gap-6 mt-12 max-w-2xl mx-auto">
            <Button
              size="lg"
              onClick={() => navigate("/weight")}
              className="h-16 text-lg flex items-left justify-center gap-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Scale className="!h-12 !w-12" />
              <div className="text-left">
                <div className="font-bold">Register Weight</div>
                <div className="text-sm opacity-90">Keep a log of your weight progress</div>
              </div>
            </Button>

            <Button
              size="lg"
              onClick={() => navigate("/week-plan")}
              className="h-16 text-lg flex items-left justify-center gap-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Calendar className="!h-12 !w-12" />
              <div className="text-left">
                <div className="font-bold">Static Week Plan</div>
                <div className="text-sm opacity-90">Keep a static plan of activities</div>
              </div>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
