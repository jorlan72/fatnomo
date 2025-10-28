import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface WeightEntry {
  id: string;
  weight_kg: number;
  entry_date: string;
  created_at: string;
}

interface WeightHistoryProps {
  entries: WeightEntry[];
}

const WeightHistory = ({ entries }: WeightHistoryProps) => {
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
                  <span className="text-2xl font-bold text-primary">
                    {entry.weight_kg} kg
                  </span>
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
