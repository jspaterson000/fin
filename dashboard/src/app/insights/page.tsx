import { getAnomalies, getIncomeVsExpenses, getSpendingByCategory } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InsightsPage() {
  const [anomalies, incomeExpenses, categories] = await Promise.all([
    getAnomalies(),
    getIncomeVsExpenses(3),
    getSpendingByCategory(30),
  ]);

  const thisMonth = incomeExpenses[incomeExpenses.length - 1];
  const lastMonth = incomeExpenses[incomeExpenses.length - 2];

  const spendChange = thisMonth && lastMonth
    ? ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses * 100).toFixed(0)
    : null;

  const incomeChange = thisMonth && lastMonth
    ? ((thisMonth.income - lastMonth.income) / lastMonth.income * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Insights</h1>

      {thisMonth && lastMonth && (
        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Spending</span>
              <Badge variant={Number(spendChange) > 0 ? "destructive" : "default"}>
                {Number(spendChange) > 0 ? "+" : ""}{spendChange}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Income</span>
              <Badge variant={Number(incomeChange) >= 0 ? "default" : "destructive"}>
                {Number(incomeChange) > 0 ? "+" : ""}{incomeChange}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.slice(0, 5).map((c) => (
            <div key={c.category} className="flex justify-between">
              <span>{c.category}</span>
              <span className="font-medium">${Number(c.total).toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <p className="text-muted-foreground">No unusual spending detected recently.</p>
          ) : (
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{a.merchantNormalised ?? a.description}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(a.date).toLocaleDateString("en-AU")} · {a.category}
                    </span>
                  </div>
                  <Badge variant="outline">{a.multiple.toFixed(1)}x avg</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
