import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface WeightEntry {
  id: string;
  weight_kg: number;
  entry_date: string;
  created_at: string;
}

interface WeightHistoryProps {
  entries: WeightEntry[];
  onEntryDeleted: () => void;
}

const WeightHistory = ({ entries, onEntryDeleted }: WeightHistoryProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("weight_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Weight entry deleted successfully",
      });
      onEntryDeleted();
    }
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl">Weight History</CardTitle>
        <CardDescription>Your recent weight entries</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No entries yet. Start by logging your weight!
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entry.entry_date), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      {entry.weight_kg} kg
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WeightHistory;
