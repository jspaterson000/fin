# Fin — Personal Finance CLI & Dashboard

Personal finance tool. CLI-first with a companion Next.js dashboard.

## Architecture

pnpm workspace monorepo:
- `packages/db/` — Shared Drizzle schema (@fin/db)
- `cli/` — Commander.js CLI tool
- `dashboard/` — Next.js read-only dashboard

## Tech Stack

- **CLI:** Node.js, TypeScript, Commander.js, @clack/prompts
- **Dashboard:** Next.js (App Router), shadcn/ui, Tailwind CSS 4, Recharts
- **Database:** PostgreSQL via Drizzle ORM
- **Categorisation:** Claude CLI via child_process

## Commands

```bash
pnpm install          # Install all workspace deps
pnpm db:push          # Push schema to Postgres
pnpm db:studio        # Drizzle Studio
pnpm dev              # Dashboard dev server (port 3000)
pnpm build            # Dashboard production build
cd cli && pnpm dev    # Run CLI in dev mode
cd cli && pnpm test   # Run tests
```

## CLI Usage

```bash
fin                   # Interactive menu
fin sync              # Sync UP Banking accounts
fin import <csv>      # Import Macquarie CSV
fin categorise        # AI-categorise uncategorised transactions
fin summary           # Weekly financial briefing
fin accounts          # List accounts with balances
fin anomalies         # Flag unusual spending
```

## Environment Variables

CLI (`cli/.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/fin
UP_API_TOKEN=<up-banking-personal-access-token>
UP_API_TOKEN_THALYA=<optional-partner-token>
```

Dashboard (`dashboard/.env.local`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/fin
```

## Key Patterns

- Shared DB schema in `packages/db/` — both CLI and dashboard import from `@fin/db`
- Lazy database connection via Proxy in `packages/db/src/connection.ts` (allows dotenv to load before connection)
- CLI entry point uses tsx for TypeScript execution without compilation (`cli/bin/fin.js`)
- Dashboard is read-only — all writes happen through the CLI
- Multi-token sync supports tracking multiple UP accounts (e.g. household members)
