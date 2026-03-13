import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  merchants: { merchant: string; total: string; count: number }[];
}

export function TopMerchants({ merchants }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((m) => (
              <TableRow key={m.merchant}>
                <TableCell className="font-medium">{m.merchant}</TableCell>
                <TableCell className="text-right">${Number(m.total).toFixed(2)}</TableCell>
                <TableCell className="text-right">{m.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
