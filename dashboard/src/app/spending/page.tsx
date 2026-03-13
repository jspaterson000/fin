import { getSpendingByCategory, getTopMerchants, getCategoryTrends } from "@/lib/queries";
import { CategoryDonut } from "@/components/category-donut";
import { CategoryTrends } from "@/components/category-trends";
import { TopMerchants } from "@/components/top-merchants";
import Link from "next/link";

export default async function SpendingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period ?? "30";
  const days = parseInt(period);
  const months = Math.max(Math.ceil(days / 30), 1);

  const [categories, merchants, trends] = await Promise.all([
    getSpendingByCategory(days),
    getTopMerchants(days),
    getCategoryTrends(months),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spending</h1>
        <div className="flex gap-2">
          {[
            { label: "30 days", value: "30" },
            { label: "3 months", value: "90" },
            { label: "6 months", value: "180" },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={`/spending?period=${opt.value}`}
              className={`px-3 py-1 rounded-md text-sm ${period === opt.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonut data={categories} />
        <TopMerchants merchants={merchants} />
      </div>
      <CategoryTrends data={trends} />
    </div>
  );
}
