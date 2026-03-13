const BASE_URL = "https://api.up.com.au/api/v1";

export interface UpAccount {
  id: string;
  attributes: {
    displayName: string;
    accountType: "TRANSACTIONAL" | "SAVER" | "HOME_LOAN";
    ownershipType: "INDIVIDUAL" | "JOINT";
    balance: {
      value: string;
      valueInBaseUnits: number;
    };
  };
}

export interface UpTransaction {
  id: string;
  attributes: {
    description: string;
    amount: {
      value: string;
      valueInBaseUnits: number;
    };
    status: "HELD" | "SETTLED";
    settledAt: string | null;
    createdAt: string;
  };
  relationships: {
    category: { data: { id: string } | null };
    parentCategory: { data: { id: string } | null };
  };
}

export class UpApi {
  constructor(private token: string) {}

  private async fetchPaginated<T>(url: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (!res.ok) {
        throw new Error(`UP API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      results.push(...json.data);
      nextUrl = json.links?.next ?? null;
    }

    return results;
  }

  async getAccounts(): Promise<UpAccount[]> {
    return this.fetchPaginated(`${BASE_URL}/accounts?page[size]=100`);
  }

  async getTransactions(accountId: string, since?: string): Promise<UpTransaction[]> {
    let url = `${BASE_URL}/accounts/${accountId}/transactions?page[size]=100&filter[status]=SETTLED`;
    if (since) {
      url += `&filter[since]=${encodeURIComponent(since)}`;
    }
    return this.fetchPaginated(url);
  }
}
