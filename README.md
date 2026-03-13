# fin

Personal finance toolkit — CLI + dashboard for tracking spending, income, and net position across multiple bank accounts.

Built for households using [UP Banking](https://up.com.au) (Australian neobank) with optional Macquarie CSV import. Features AI-powered transaction categorisation via Claude and a read-only Next.js dashboard.

## Overview

```
┌─────────────────────────────────────────────────────┐
│                    fin monorepo                      │
│                                                      │
│  packages/db/    Shared Drizzle ORM schema           │
│  cli/            CLI tool (sync, categorise, report) │
│  dashboard/      Next.js read-only dashboard         │
└─────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
   ┌───────────┐              ┌─────────────┐
   │ UP Banking│              │  PostgreSQL  │
   │    API    │──────────────│   (fin db)   │
   └───────────┘              └─────────────┘
```

## Features

**CLI**

- `fin sync` — Pull accounts & transactions from UP Banking API (multi-token for joint tracking)
- `fin import <csv>` — Import Macquarie Bank CSV exports
- `fin categorise` — AI-categorise uncategorised transactions using Claude
- `fin summary` — Weekly financial briefing with AI-generated insights
- `fin accounts` — List all accounts with current balances
- `fin anomalies` — Flag spending over 2x your category average
- Interactive menu when run without arguments

**Dashboard**

- **Overview** — Net position, weekly change, burn rate, runway estimate, anomaly alerts
- **Accounts** — All accounts with balance sparklines
- **Spending** — Category donut chart, top merchants, trends over time
- **Transactions** — Filterable, searchable transaction table
- **Insights** — AI-generated observations about your spending patterns

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| CLI | TypeScript, Commander.js, @clack/prompts |
| Dashboard | Next.js 16 (App Router), shadcn/ui, Tailwind CSS 4, Recharts |
| Database | PostgreSQL, Drizzle ORM |
| AI | Claude CLI for categorisation and insights |
| Bank API | [UP Banking API v1](https://developer.up.com.au/) |

## Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (local or Docker)
- [UP Banking](https://up.com.au) personal access token(s)

### Install

```bash
git clone https://github.com/jacobpatterson/fin.git
cd fin
pnpm install
```

### Database

Create a PostgreSQL database and push the schema:

```bash
# Create the database
createdb fin

# Set connection string
echo 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fin' > packages/db/.env

# Push schema
pnpm db:push
```

### Environment

**CLI** (`cli/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fin
UP_API_TOKEN=up:yeah:your-token-here
# Optional: second token for joint household tracking
UP_API_TOKEN_THALYA=up:yeah:partner-token-here
```

**Dashboard** (`dashboard/.env.local`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fin
```

Get your UP API token at [api.up.com.au](https://api.up.com.au/getting_started).

### Run

```bash
# Sync your UP accounts
cd cli && pnpm dev -- sync

# Start the dashboard
pnpm dev  # from root — runs on http://localhost:3000
```

## CLI Usage

```
$ fin

◆  fin
│  What would you like to do?
│  ● Sync UP accounts
│  ○ Import Macquarie CSV
│  ○ Categorise transactions
│  ○ Weekly summary
│  ○ View accounts
│  ○ Check anomalies
└
```

Or run commands directly:

```bash
fin sync                  # Sync all UP accounts
fin import statement.csv  # Import a Macquarie CSV
fin categorise            # AI-categorise with Claude
fin summary               # Weekly briefing
fin accounts              # List accounts + balances
fin anomalies             # Flag unusual spending
```

## Database Schema

Four tables in `packages/db/src/schema.ts`:

- **accounts** — Bank accounts with owner, type, and UP account ID
- **transactions** — All transactions with category, merchant, and amounts
- **account_snapshots** — Daily balance snapshots for trend tracking
- **sync_log** — Audit trail for sync and import operations

## Deployment

A systemd service file is included for running the dashboard as a service:

```bash
# Build the dashboard
cd dashboard && pnpm build

# Copy the service file and start
sudo cp fin-dashboard.service /etc/systemd/system/
sudo systemctl enable --now fin-dashboard
```

The CLI can be linked globally:

```bash
cd cli && pnpm link --global
fin sync  # now available anywhere
```

## Development

```bash
pnpm install          # Install all workspace deps
pnpm dev              # Dashboard dev server
pnpm build            # Production build
pnpm db:push          # Push schema changes
pnpm db:studio        # Drizzle Studio (DB browser)
cd cli && pnpm test   # Run CLI tests
```

## License

MIT
