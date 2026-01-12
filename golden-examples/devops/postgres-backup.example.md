---
id: "devops_002_pg_backup"
difficulty: "medium"
tags: ["github-actions", "postgresql", "backup", "r2", "cron"]
source_url: "https://fly.io/docs/postgres/"
---

# PostgreSQL Backup Automation with GitHub Actions

## Problem
Automating daily database backups for a zero-cost infrastructure without relying on paid managed service backup features.

## Solution

```yaml
# .github/workflows/backup-database.yml
name: Automated PostgreSQL Backup

on:
  schedule:
    # Daily at 2 AM Singapore time (18:00 UTC)
    - cron: '0 18 * * *'
  workflow_dispatch: # Manual trigger

env:
  TZ: Asia/Singapore

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Install Fly.io CLI
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Create backup
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          # Create timestamped backup
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="sanadflow_backup_${TIMESTAMP}.sql.gz"
          
          # Dump from Fly.io Postgres
          flyctl postgres connect -a sanadflow-db -c "pg_dump -Fc" | gzip > $BACKUP_FILE
          
          # Upload to GitHub artifacts
          echo "BACKUP_FILE=$BACKUP_FILE" >> $GITHUB_ENV
      
      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ env.BACKUP_FILE }}
          path: ${{ env.BACKUP_FILE }}
          retention-days: 30 # Keep daily for 30 days
      
      - name: Upload to R2 (Optional free tier)
        if: github.event_name == 'schedule'
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_KEY }}
        run: |
          # Install rclone
          curl https://rclone.org/install.sh | sudo bash
          
          # Configure R2
          cat > rclone.conf <<EOF
          [r2]
          type = s3
          provider = Cloudflare
          access_key_id = $R2_ACCESS_KEY
          secret_access_key = $R2_SECRET_KEY
          endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
          EOF
          
          # Upload with retention policy
          rclone copy ${{ env.BACKUP_FILE }} r2:sanadflow-backups/daily/ --config rclone.conf
      
      - name: Cleanup old backups
        run: |
          # Keep only last 7 daily backups locally
          ls -t sanadflow_backup_*.sql.gz | tail -n +8 | xargs rm -f || true
      
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Database backup failed for SanadFlow",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Backup Job Failed*\nWorkflow: ${{ github.workflow }}\nTime: $(date)"
                  }
                }
              ]
            }
```

## Key Learnings
- **Cost Efficiency**: Leveraging GitHub Actions' free tier (2000 minutes/month) and Cloudflare R2's free tier (10GB) creates a robust $0 backup solution.
- **Redundancy**: Storing backups in both GitHub Artifacts and an external S3-compatible store (R2) prevents data loss if one service is unavailable.
- **Automation**: Cron-based scheduling ensures backups happen without human intervention.
- **Compression**: Gzipping dumps significantly reduces storage usage and transfer time.
