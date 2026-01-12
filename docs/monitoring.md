# Production Monitoring & Alerting

This document outlines the monitoring strategy for SanadFlow Study Hub to ensure high availability (99.5% uptime SLA) and proactive issue detection.

## 1. Uptime Monitoring (UptimeRobot)

We use [UptimeRobot](https://uptimerobot.com) to monitor the availability of the application.

- **Monitor Type**: HTTP(s)
- **URL**: `https://sanadflow.vercel.app/api/health`
- **Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Alert Contact**: Slack Webhook (configured in UptimeRobot dashboard)
- **Secondary Alerts**: Application-level alerts can be configured via `SLACK_WEBHOOK_URL` GitHub Secret for internal system notifications.

### Health Check Endpoint Details
The `/api/health` endpoint verifies:
- **Database**: Connectivity to Supabase PostgreSQL.
- **Storage**: Availability of Supabase Storage buckets.
- **Auth**: Status of Supabase Auth service.

A `200 OK` status indicates all systems are functional. A `503 Service Unavailable` status triggers a critical alert.

## 2. Supabase Infrastructure Alerts

Configured in the [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/alerts):

| Alert Type | Threshold | Action |
|------------|-----------|--------|
| **Database Size** | > 400MB | Critical: Optimize or upgrade from Free Tier (500MB limit) |
| **API Requests** | > 8M / month | Warning: Near 10M limit |
| **Edge Functions** | > 800k / month | Warning: Near 1M limit |
| **Storage Usage** | > 4GB | Warning: Near 5GB limit |

## 3. Error Tracking & Logging

### Vercel Logs
Real-time runtime logs are available via the Vercel Dashboard for API route failures and frontend errors.

### BetterStack Logs (Integrated)
Logs are streamed to BetterStack for long-term retention and structured searching.
- **Log Source**: Vercel Log Drain.
- **Retention**: 3 days (Free Tier).

## 4. Alerting Channels

- **Slack**: #alerts-sanadflow (via incoming webhook).
- **Email**: Admin team distribution list.

> [!IMPORTANT]
> If UptimeRobot reports **DOWN**, check the [Supabase Status Page](https://status.supabase.com/) and [Vercel Status Page](https://www.vercel-status.com/) before investigating application code.
