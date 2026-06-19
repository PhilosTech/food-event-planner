# Food Event Planner - Claude Instructions

## Project Overview
Web app for coordinating food preparation at community events.
Admin creates rooms, volunteers join via password, collaboratively plan dishes, ingredients, assignments.

## Architecture
Monorepo (pnpm workspaces):
- `apps/web` - Next.js 15, TypeScript, Tailwind CSS -> Vercel
- `apps/api` - Express + Node.js -> Render
- `packages/db` - Prisma schema + Neon (PostgreSQL)
- `packages/types` - shared TypeScript types

## Work Modes
- **Normal** - single task execution
- **Orchestrator** - break into subtasks, spawn agents per app/package
- **Batch** - list of tasks, execute independently

## Key Conventions
- Mobile-first in all UI components
- API responses: `{ data: T }` on success, `{ error: string }` on failure
- Auth: JWT for admin, short-lived role tokens for room access
- No user accounts for volunteers - password-only entry

## Local Dev
```bash
pnpm install
docker-compose up -d   # local Postgres
pnpm --filter api dev
pnpm --filter web dev
```

## Environment Variables
See `.env.example` in each app directory.

## Planning Docs
Full concept and dev plan in `.planning/` (local only, not in repo).

## Deploy
- Frontend: Vercel (auto-deploy from main branch, `apps/web`)
- Backend: Render (Node service, `apps/api`)
- Database: Neon PostgreSQL
