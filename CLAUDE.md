# Fin — Personal Finance CLI & Dashboard

Personal finance tool for Jacob & Thalya. CLI-first with a companion Next.js dashboard.

## Architecture

pnpm workspace monorepo:
- `packages/db/` — Shared Drizzle schema (@fin/db)
- `cli/` — Commander.js CLI tool
- `dashboard/` — Next.js read-only dashboard

## Infrastructure

| Host | Alias | LAN IP | Tailscale IP | User | Role |
|------|-------|--------|--------------|------|------|
| **Luna VM** | `ssh luna` | LAN_IP_REDACTED | TAILSCALE_IP_REDACTED | jacob | Fin dashboard + DB |
| **Proxmox** | `ssh proxmox` | LAN_IP_REDACTED | TAILSCALE_IP_REDACTED | root | Hypervisor |

SSH key auth configured via `~/.ssh/config`.

### Remote Access (Tailscale)

All VMs run Tailscale with SSH enabled:
```bash
ssh jacob@luna        # or ssh jacob@TAILSCALE_IP_REDACTED
ssh root@proxmox      # or ssh root@TAILSCALE_IP_REDACTED
```

## Tech Stack

- **CLI:** Node.js, TypeScript, Commander.js, @clack/prompts
- **Dashboard:** Next.js (App Router), shadcn/ui, Tailwind CSS 4, Recharts
- **Database:** PostgreSQL `fin` (on Luna VM, same instance as server dashboard)
- **ORM:** Drizzle
- **Categorisation:** Claude CLI via child_process

## Commands

```bash
pnpm install          # Install all workspace deps
pnpm db:push          # Push schema to Postgres
pnpm db:studio        # Drizzle Studio
pnpm dev              # Dashboard dev server (port 3000)
pnpm build            # Dashboard production build
cd cli && pnpm dev    # Run CLI in dev mode
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

## Deployment

```bash
scp -r cli/ luna:/home/jacob/fin/cli/
scp -r dashboard/ luna:/home/jacob/fin/dashboard/
scp -r packages/ luna:/home/jacob/fin/packages/

ssh luna "cd /home/jacob/fin/cli && pnpm install && pnpm link --global"
ssh luna "cd /home/jacob/fin/dashboard && pnpm install && pnpm build && echo 'REDACTED_PASSWORD' | sudo -S systemctl restart fin-dashboard"
```

Dashboard: port 3001, systemd service `fin-dashboard.service`.

## Environment Variables

CLI `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fin
UP_API_TOKEN=<up-banking-personal-access-token>
```

Dashboard `.env.local`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fin
```
