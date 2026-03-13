import { getNetPosition, getNetPositionHistory, getIncomeVsExpenses, getAnomalies } from "@/lib/queries";
import { NetPositionCard } from "@/components/net-position-card";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { BurnRateCard } from "@/components/burn-rate-card";
import { AnomalyAlerts } from "@/components/anomaly-alerts";

export default async function OverviewPage() {
  const [netPosition, history, incomeExpenses, anomalies] = await Promise.all([
    getNetPosition(),
    getNetPositionHistory(90),
    getIncomeVsExpenses(3),
    getAnomalies(),
  ]);

  const historyData = history.map((h) => ({ date: h.date, total: Number(h.total) }));
  const currentTotal = netPosition;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoEntry = [...historyData].reverse().find((h) => new Date(h.date) <= weekAgo);
  const weekChange = currentTotal - (weekAgoEntry?.total ?? currentTotal);

  const lastMonth = incomeExpenses[incomeExpenses.length - 1];
  const monthlyBurn = lastMonth?.expenses ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <NetPositionCard total={currentTotal} change={weekChange} history={historyData} />
        <BurnRateCard monthlyBurn={monthlyBurn} netPosition={currentTotal} />
      </div>

      <IncomeExpenseChart data={incomeExpenses} />

      <AnomalyAlerts anomalies={anomalies} />
    </div>
  );
}
