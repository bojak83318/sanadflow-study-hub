# Environment Variables Reference

> **SanadFlow Study Hub - TDD v3.0 (Supabase + Vercel)**  
> **Last Updated**: January 12, 2026

This document provides a complete reference for all environment variables required for the SanadFlow Study Hub deployment.

---

## Quick Reference

| Variable | Required | Public | Source |
|----------|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | Supabase Dashboard |
| `SUPABASE_JWT_SECRET` | ✅ | ❌ | Supabase Dashboard |
| `DATABASE_URL` | ✅ | ❌ | Supabase Dashboard |
| `DIRECT_URL` | ✅ | ❌ | Supabase Dashboard |
| `R2_ACCOUNT_ID` | Optional | ❌ | Cloudflare Dashboard |
| `R2_ACCESS_KEY_ID` | Optional | ❌ | Cloudflare Dashboard |
| `R2_SECRET_ACCESS_KEY` | Optional | ❌ | Cloudflare Dashboard |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | Vercel Deployment |

---

## Supabase Variables

### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Supabase project API URL
- **Format**: `https://<project-ref>.supabase.co`
- **Source**: Supabase Dashboard → Settings → API → Project URL
- **Public**: Yes (exposed to browser)
- **Example**: `https://abcdefghijklmnop.supabase.co`

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous (public) API key
- **Format**: JWT token (starts with `eyJ`)
- **Source**: Supabase Dashboard → Settings → API → anon public
- **Public**: Yes (exposed to browser)
- **Security**: Safe to expose - works with Row-Level Security (RLS)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key with admin privileges
- **Format**: JWT token (starts with `eyJ`)
- **Source**: Supabase Dashboard → Settings → API → service_role
- **Public**: ❌ **NEVER expose to browser or commit to Git**
- **Usage**: Server-side API routes only
- **Security**: Bypasses RLS - use with extreme caution

### `SUPABASE_JWT_SECRET`
- **Description**: Secret used to sign and verify JWT tokens
- **Format**: Random string
- **Source**: Supabase Dashboard → Settings → API → JWT Secret
- **Public**: ❌ Never expose
- **Usage**: Validate custom JWT tokens (rarely needed with Supabase Auth)

---

## Database Variables

### `DATABASE_URL`
- **Description**: PostgreSQL connection string through Supabase Pooler
- **Port**: `6543` (transaction mode pooler)
- **Format**: `postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:6543/postgres?pgbouncer=true`
- **Source**: Supabase Dashboard → Settings → Database → Connection string → URI
- **Usage**: Prisma Client runtime queries
- **Note**: The `?pgbouncer=true` suffix is required for Prisma compatibility

### `DIRECT_URL`
- **Description**: Direct PostgreSQL connection (bypasses pooler)
- **Port**: `5432`
- **Format**: `postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`
- **Source**: Supabase Dashboard → Settings → Database → Connection string → URI (change port to 5432)
- **Usage**: Prisma migrations, `pg_dump` backups
- **Note**: Limited to 15 concurrent connections on free tier

---

## Cloudflare R2 Variables (Optional)

> These variables are optional and only needed if you want to store backups in Cloudflare R2 in addition to GitHub Artifacts.

### `R2_ACCOUNT_ID`
- **Description**: Cloudflare account identifier
- **Format**: 32-character hex string
- **Source**: Cloudflare Dashboard → R2 → Overview → Account ID

### `R2_ACCESS_KEY_ID`
- **Description**: R2 API access key ID
- **Format**: 32-character alphanumeric string
- **Source**: Cloudflare Dashboard → R2 → Manage R2 API Tokens

### `R2_SECRET_ACCESS_KEY`
- **Description**: R2 API secret access key
- **Format**: 64-character string
- **Source**: Cloudflare Dashboard → R2 → Manage R2 API Tokens
- **Note**: Only shown once when created

---

## Application Variables

### `NEXT_PUBLIC_APP_URL`
- **Description**: Public URL of the deployed application
- **Format**: `https://` prefixed URL
- **Value (Production)**: `https://sanadflow.vercel.app`
- **Value (Preview)**: Vercel preview URL (auto-set by Vercel)
- **Value (Development)**: `http://localhost:3000`
- **Usage**: OAuth redirects, absolute URL generation, CORS

---

## Configuration by Environment

### Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Production & Preview
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=[jwt-secret]
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://sanadflow.vercel.app

# Optional (for R2 backups)
R2_ACCOUNT_ID=[account-id]
R2_ACCESS_KEY_ID=[access-key]
R2_SECRET_ACCESS_KEY=[secret-key]
```

### GitHub Secrets

Set these in GitHub Repository → Settings → Secrets and variables → Actions:

| Secret Name | Value Source |
|-------------|--------------|
| `DATABASE_URL` | Same as Vercel DATABASE_URL |
| `DIRECT_URL` | Same as Vercel DIRECT_URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as Vercel |
| `R2_ACCOUNT_ID` | Cloudflare Dashboard |
| `R2_ACCESS_KEY_ID` | Cloudflare Dashboard |
| `R2_SECRET_ACCESS_KEY` | Cloudflare Dashboard |

### Local Development (.env.local)

Create `.env.local` in project root (never commit this file):

```bash
# Supabase (use your development project)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=[jwt-secret]

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Local app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

---

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side code
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets are hardcoded in source code
- [ ] Vercel environment variables are set as "Sensitive" where applicable
- [ ] GitHub secrets are encrypted
- [ ] `DIRECT_URL` is only used for migrations and backups (not runtime)

---

## Troubleshooting

### "Missing Supabase configuration" error
Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

### "prepared statement already exists" error
Add `?pgbouncer=true` to the end of your `DATABASE_URL`.

### Prisma migration fails
Use `DIRECT_URL` (port 5432) for migrations, not `DATABASE_URL` (port 6543).

### Connection timeout
Check that your IP is not blocked by Supabase. Free tier allows all IPs by default.
