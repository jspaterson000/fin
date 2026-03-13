"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(24, 100%, 50%)", "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 51%)",
];

interface Props {
  data: { category: string | null; total: string }[];
}

export function CategoryDonut({ data }: Props) {
  const chartData = data.map((d, i) => ({
    name: d.category ?? "Uncategorised",
    value: Number(d.total),
    fill: COLORS[i % COLORS.length],
  }));

  const config: Record<string, { label: string; color: string }> = {};
  chartData.forEach((d) => {
    config[d.name] = { label: d.name, color: d.fill };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium">${d.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
