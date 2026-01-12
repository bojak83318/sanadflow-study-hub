# Project Context: SanadFlow Study Hub

## Project Goal
Zero-pilot-cost Islamic Sciences collaborative platform for 5-10 students. Focus on Arabic RTL support, Tldraw whiteboard, and Postgres/Prisma backend.

## Architecture
- **Frontend**: Next.js 14 (Supabase + Vercel)
- **Backend**: Next.js API Routes + Prisma
- **Database**: Supabase PostgreSQL + Pooler
- **Auth**: Supabase Auth (Email/Password)
- **Real-time**: Yjs + Supabase Realtime

## Directory Structure
- `docs/`: ADD, TDD, and PRD
- `stories/`: User stories
- `skills/`: Agent personas
- `src/`: Application source code


## 🔐 Authentication & Secrets Management
> [!IMPORTANT]
> **GitHub Authentication Rule**: Always use the `GH_TOKEN` from `.env.local` for GitHub CLI operations and git push. 
> **NEVER** rely on global git credentials or GitHub Actions secrets for local maintenance operations.
>
> **Workflow**:
> 1. Ensure `.env.local` contains `GH_TOKEN=ghp_...`
> 2. For `gh` commands: `export GH_TOKEN=$(grep GH_TOKEN .env.local | cut -d '=' -f2) && gh ...`
> 3. For `git push`: The `gh auth login --with-token` (using .env.local) handles the credential helper.

