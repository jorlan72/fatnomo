import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface WeightEntry {
  id: string;
  weight_kg: number;
  entry_date: string;
  created_at: string;
}

interface WeightChartProps {
  entries: WeightEntry[];
}

const WeightChart = ({ entries }: WeightChartProps) => {
  // Sort entries by date (oldest first for chart)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  const chartData = sortedEntries.map((entry) => ({
    date: format(new Date(entry.entry_date), "MMM d"),
    weight: entry.weight_kg,
  }));

  const calculateProgress = () => {
    if (sortedEntries.length < 2) return null;
    const first = sortedEntries[0].weight_kg;
    const last = sortedEntries[sortedEntries.length - 1].weight_kg;
    const diff = first - last;
    return {
      amount: Math.abs(diff).toFixed(1),
      direction: diff > 0 ? "lost" : "gained",
    };
  };

  const progress = calculateProgress();

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl">Progress Chart</CardTitle>
        <CardDescription>
          {progress
            ? `You've ${progress.direction} ${progress.amount} kg since you started!`
            : "Track your progress over time"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Add more weight entries to see your progress chart
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightChart;
