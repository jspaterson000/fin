import { getTransactions } from "@/lib/queries";
import { TransactionTable } from "@/components/transaction-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 50;

  const transactions = await getTransactions({
    limit,
    offset: (page - 1) * limit,
    category: params.category,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <Card>
        <CardContent className="pt-6">
          <TransactionTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
