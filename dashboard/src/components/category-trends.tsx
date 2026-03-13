"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

interface Props {
  data: { month: string; category: string | null; total: string }[];
}

export function CategoryTrends({ data }: Props) {
  const categories = [...new Set(data.map((d) => d.category).filter(Boolean))] as string[];
  const months = [...new Set(data.map((d) => d.month))];

  const pivoted = months.map((month) => {
    const row: Record<string, string | number> = { month };
    for (const cat of categories) {
      const entry = data.find((d) => d.month === month && d.category === cat);
      row[cat] = entry ? Number(entry.total) : 0;
    }
    return row;
  });

  const config: Record<string, { label: string; color: string }> = {};
  categories.forEach((cat, i) => {
    config[cat] = { label: cat, color: COLORS[i % COLORS.length] };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64">
          <LineChart data={pivoted}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {categories.slice(0, 5).map((cat, i) => (
              <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
