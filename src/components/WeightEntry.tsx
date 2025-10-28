import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const weightSchema = z.object({
  weight: z.number().min(1, "Weight must be greater than 0").max(500, "Weight must be less than 500kg"),
});

interface WeightEntryProps {
  onEntryAdded: () => void;
}

const WeightEntry = ({ onEntryAdded }: WeightEntryProps) => {
  const [weight, setWeight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = parseFloat(weight);
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

    const { error } = await supabase
      .from("weight_entries")
      .insert([
        {
          user_id: user.id,
          weight_kg: weightNum,
          entry_date: new Date().toISOString().split('T')[0],
        },
      ]);

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
        description: "Weight entry saved successfully",
      });
      setWeight("");
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
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
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
