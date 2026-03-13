"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";

interface Props {
  name: string;
  type: string;
  bank: string;
  balance: number;
  sparkline: number[];
  lastSyncedAt: string | null;
}

export function AccountCard({ name, type, bank, balance, sparkline, lastSyncedAt }: Props) {
  const sparkData = sparkline.map((v, i) => ({ i, v }));
  const lastSync = lastSyncedAt ? new Date(lastSyncedAt).toLocaleDateString("en-AU") : "never";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
          <Badge variant="outline">{bank.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${balance.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-muted-foreground">{type} · synced {lastSync}</p>
        {sparkData.length > 1 && (
          <ChartContainer config={{ v: { label: "Balance", color: "hsl(var(--chart-1))" } }} className="h-12 mt-2">
            <AreaChart data={sparkData}>
              <Area type="monotone" dataKey="v" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
