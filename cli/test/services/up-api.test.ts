import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpApi } from "../../src/services/up-api.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("UpApi", () => {
  const api = new UpApi("test-token");

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches accounts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "acc-1",
            attributes: {
              displayName: "Spending",
              accountType: "TRANSACTIONAL",
              ownershipType: "INDIVIDUAL",
              balance: { value: "1234.56", valueInBaseUnits: 123456 },
            },
          },
        ],
        links: { next: null },
      }),
    });

    const accounts = await api.getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe("acc-1");
    expect(accounts[0].attributes.displayName).toBe("Spending");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.up.com.au/api/v1/accounts?page[size]=100",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
      })
    );
  });

  it("paginates accounts", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "acc-1", attributes: { displayName: "A", accountType: "TRANSACTIONAL", ownershipType: "INDIVIDUAL", balance: { value: "1.00", valueInBaseUnits: 100 } } }],
          links: { next: "https://api.up.com.au/api/v1/accounts?page[after]=cursor1" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "acc-2", attributes: { displayName: "B", accountType: "SAVER", ownershipType: "INDIVIDUAL", balance: { value: "2.00", valueInBaseUnits: 200 } } }],
          links: { next: null },
        }),
      });

    const accounts = await api.getAccounts();
    expect(accounts).toHaveLength(2);
  });

  it("fetches transactions with since filter", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "txn-1",
            attributes: {
              description: "Woolworths",
              amount: { value: "-45.50", valueInBaseUnits: -4550 },
              status: "SETTLED",
              settledAt: "2026-03-10T10:00:00+10:00",
              createdAt: "2026-03-10T10:00:00+10:00",
            },
            relationships: {
              category: { data: { id: "groceries", type: "categories" } },
              parentCategory: { data: null },
            },
          },
        ],
        links: { next: null },
      }),
    });

    const txns = await api.getTransactions("acc-1", "2026-03-01T00:00:00+10:00");
    expect(txns).toHaveLength(1);
    expect(txns[0].id).toBe("txn-1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("filter[since]="),
      expect.any(Object)
    );
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(api.getAccounts()).rejects.toThrow("UP API error: 401 Unauthorized");
  });
});
