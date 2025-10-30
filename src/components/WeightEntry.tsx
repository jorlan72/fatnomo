import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const weightSchema = z.object({
  weight: z.number().min(1, "Weight must be greater than 0").max(500, "Weight must be less than 500kg"),
});

interface WeightEntryProps {
  onEntryAdded: () => void;
}

const WeightEntry = ({ onEntryAdded }: WeightEntryProps) => {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = parseFloat(weight.replace(',', '.'));
    const validation = weightSchema.safeParse({ weight: weightNum });

    if (!validation.success) {
      toast({
        title: "Invalid Weight",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add weight entries",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const entryDate = format(date, "yyyy-MM-dd");

    // Check if entry already exists for this date
    const { data: existingEntry } = await supabase
      .from("weight_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date", entryDate)
      .maybeSingle();

    let error;
    if (existingEntry) {
      // Update existing entry
      const result = await supabase
        .from("weight_entries")
        .update({ weight_kg: weightNum })
        .eq("id", existingEntry.id);
      error = result.error;
    } else {
      // Insert new entry
      const result = await supabase
        .from("weight_entries")
        .insert([
          {
            user_id: user.id,
            weight_kg: weightNum,
            entry_date: entryDate,
          },
        ]);
      error = result.error;
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: existingEntry ? "Weight entry updated successfully" : "Weight entry saved successfully",
      });
      setWeight("");
      setDate(new Date());
      onEntryAdded();
    }
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl">Log Your Weight</CardTitle>
        <CardDescription>Enter your current weight in kilograms</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      setIsCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="text"
              inputMode="decimal"
              placeholder="75,5"
              value={weight}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*[,.]?\d*$/.test(value)) {
                  setWeight(value);
                }
              }}
              required
              disabled={isLoading}
              className="text-lg"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Weight"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WeightEntry;
