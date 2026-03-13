import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Anomaly {
  id: number;
  date: Date;
  description: string;
  amount: string;
  category: string | null;
  merchantNormalised: string | null;
  multiple: number;
}

export function AnomalyAlerts({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="text-orange-800 dark:text-orange-200">Unusual Spending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((a) => (
          <div key={a.id} className="flex items-center justify-between">
            <div>
              <span className="font-medium">{a.merchantNormalised ?? a.description}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {new Date(a.date).toLocaleDateString("en-AU")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">${Math.abs(Number(a.amount)).toFixed(2)}</span>
              <Badge variant="outline" className="text-orange-700">
                {a.multiple.toFixed(1)}x avg
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
