# SanadFlow Deployment Guide

This guide provides step-by-step instructions for deploying SanadFlow Study Hub from scratch using Supabase and Vercel.

## Prerequisites

- **GitHub Account**: To host the repository and trigger CI/CD.
- **Supabase Account**: For Database, Auth, and Realtime services.
- **Vercel Account**: For hosting the Next.js application.
- **Node.js 20+**: Local development environment.

---

## Step 1: Supabase Infrastructure Setup

1. **Create Project**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard).
   - Create a new project. Select the region closest to your users (e.g., Singapore `ap-southeast-1`).
2. **Enable Database Extensions**:
   - Go to **Database** -> **Extensions**.
   - Enable `pg_trgm` (for search) and `unaccent` (for Arabic normalization).
3. **Database Schema & Migrations**:
   - Navigate to the **SQL Editor**.
   - Copy and run all migration scripts located in the `supabase/migrations/` directory of the repository in sequential order (001, 002, etc.).
4. **Environment Secrets**:
   - Note down the `Project URL`, `API Key (anon)`, and `Service Role Key` from **Settings** -> **API**.
   - Use the **Connection String** from **Settings** -> **Database** (use the Transaction Mode port `6543` for `DATABASE_URL`).

---

## Step 2: Vercel Application Deployment

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New** -> **Project**.
   - Connect your GitHub account and import the `qalamcolab` repository.
2. **Configure Environment Variables**:
   - Add the variables defined in `docs/environment-variables.md`. Key variables include:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `DATABASE_URL` (Direct connection for migrations, Pooler for app)
     - `SUPABASE_SERVICE_ROLE_KEY`
3. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the Next.js application.

---

## Step 3: Post-Deployment Verification

1. **Health Check**:
   - Visit `https://your-app-url.vercel.app/api/health`.
   - Ensure the JSON response reports `"status": "healthy"`.
2. **Authentication**:
   - Try signing up/logging in to verify the connection to Supabase Auth.
3. **Real-time Sync**:
   - Open two browser tabs on a collaborative room page and verify that typing synced instantly.

---

## Continuous Integration Tools

- **Backups**: Verified via the `.github/workflows/backup.yml` GitHub Action. Ensure `DIRECT_URL` is set in GitHub Secrets.
- **Keep-Alive**: The `.github/workflows/keep-alive.yml` prevents Supabase projects from pausing during inactivity.
