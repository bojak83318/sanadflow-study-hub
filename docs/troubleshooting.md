# Troubleshooting Guide

Solutions to common issues encountered during deployment or operation of SanadFlow Study Hub.

## 1. Database Connectivity Issues

### Error: `P1001: Can't reach database server`
- **Cause**: Prisma could not connect to the database.
- **Solution**:
  - Verify that `DATABASE_URL` uses the **Supabase Transaction Pooler** port `6543`.
  - Ensure the database password does not contain special characters that require URL encoding (e.g., `#`, `@`, `:`) or verify they are correctly encoded.
  - Check if the project is "Paused" in the Supabase Dashboard.

### Error: `Relation "public.User" does not exist`
- **Cause**: Migrations have not been applied.
- **Solution**:
  - Run the SQL migrations from `supabase/migrations/` in the Supabase SQL Editor.
  - If using local Prisma, run `npx prisma db push` or `npx prisma migrate deploy`.

---

## 2. Authentication Failures

### Issue: Users cannot sign in
- **Solution**:
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
  - In Supabase Dashboard, go to **Authentication** -> **URL Configuration** and ensure `Site URL` matches your Vercel deployment URL.
  - Check Vercel logs for specific API error messages.

---

## 3. Real-time & Collaboration Issues

### Issue: Collaborative editor not syncing
- **Solution**:
  - Ensure **Realtime** is enabled for the `yjs_documents` table in Supabase.
  - Check the browser console for WebSocket connection errors.
  - Verify that the `workspace_id` exists and the user has permission to access it (RLS policies).

---

## 4. RLS (Row Level Security) Denials

### Issue: Content does not load even after login
- **Solution**:
  - Check the `supabase/migrations/` files to ensure RLS policies are applied correctly.
  - Verify the user's `id` in `auth.users` matches the `user_id` in `user_profiles`.

---

## 5. Deployment Failures (Vercel)

### Error: `Build failed: npm run build exited with 1`
- **Solution**:
  - Check for TypeScript compilation errors in the build logs.
  - Ensure all environment variables required during build time (e.g., database URL) are present.
  - Verify that the `DATABASE_URL` is accessible from the Vercel build environment.
