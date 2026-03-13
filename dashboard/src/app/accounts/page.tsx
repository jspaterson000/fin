import { getAccountsWithBalances } from "@/lib/queries";
import { AccountCard } from "@/components/account-card";

export default async function AccountsPage() {
  const accounts = await getAccountsWithBalances();

  const grouped: Record<string, typeof accounts> = {};
  for (const acc of accounts) {
    const key = acc.owner === "joint" ? "Joint" : acc.owner.charAt(0).toUpperCase() + acc.owner.slice(1);
    (grouped[key] ??= []).push(acc);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Accounts</h1>
      {Object.entries(grouped).map(([owner, accs]) => (
        <div key={owner}>
          <h2 className="text-lg font-semibold mb-3">{owner}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accs.map((acc) => (
              <AccountCard
                key={acc.id}
                name={acc.name}
                type={acc.type}
                bank={acc.bank}
                balance={acc.balance}
                sparkline={acc.sparkline}
                lastSyncedAt={acc.lastSyncedAt}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
