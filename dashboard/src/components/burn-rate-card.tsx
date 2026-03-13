import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  monthlyBurn: number;
  netPosition: number;
}

export function BurnRateCard({ monthlyBurn, netPosition }: Props) {
  const runway = monthlyBurn > 0 ? Math.floor(netPosition / monthlyBurn) : Infinity;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Burn Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          ${monthlyBurn.toLocaleString("en-AU", { minimumFractionDigits: 2 })}<span className="text-lg text-muted-foreground">/mo</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {runway === Infinity ? "Infinite" : `${runway} months`} runway at current rate
        </p>
      </CardContent>
    </Card>
  );
}
