"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart } from "recharts";

interface Props {
  total: number;
  change: number;
  history: { date: string; total: number }[];
}

export function NetPositionCard({ total, change, history }: Props) {
  const arrow = change >= 0 ? "\u2191" : "\u2193";
  const changeColor = change >= 0 ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Net Position</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          ${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
        </div>
        <p className={`text-sm ${changeColor}`}>
          {arrow} ${Math.abs(change).toLocaleString("en-AU", { minimumFractionDigits: 2 })} from last week
        </p>
        {history.length > 1 && (
          <ChartContainer config={{ total: { label: "Net Position", color: "hsl(var(--chart-1))" } }} className="h-20 mt-4">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="total" stroke="hsl(var(--chart-1))" fill="url(#netGradient)" strokeWidth={2} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
