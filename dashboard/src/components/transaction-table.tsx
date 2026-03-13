import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: number;
  date: Date;
  description: string;
  amount: string;
  category: string | null;
  subcategory: string | null;
  merchantNormalised: string | null;
  note: string | null;
  isBusinessInvestment: boolean;
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((txn) => {
          const amount = Number(txn.amount);
          const isSpend = amount < 0;

          return (
            <TableRow key={txn.id}>
              <TableCell className="text-muted-foreground">
                {new Date(txn.date).toLocaleDateString("en-AU")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{txn.merchantNormalised ?? txn.description}</span>
                  {txn.isBusinessInvestment && <Badge variant="secondary">Business</Badge>}
                </div>
              </TableCell>
              <TableCell>
                {txn.category && (
                  <div>
                    <span className="text-sm">{txn.category}</span>
                    {txn.subcategory && (
                      <span className="text-xs text-muted-foreground block">{txn.subcategory}</span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className={`text-right font-medium ${isSpend ? "text-red-600" : "text-green-600"}`}>
                {isSpend ? "-" : "+"}${Math.abs(amount).toFixed(2)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                {txn.note}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
