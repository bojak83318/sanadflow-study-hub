---
id: "20260111_fly_deployment"
difficulty: "medium"
tags: ["devops", "fly.io", "postgresql", "pgbouncer", "phase-1"]
tech_stack: "Fly.io, Docker, PostgreSQL 16, PgBouncer, GitHub Actions"
---

# User Story: Fly.io Infrastructure Deployment

## As a
DevOps Engineer

## I want to
Deploy the SanadFlow infrastructure on Fly.io with proper memory constraints

## So that
We have a zero-cost, always-on platform for 10 concurrent users

## Context & Constraints
**Cost Target**: $0/month (free tier only)

**VM Allocation:**
| VM | RAM | Purpose |
|----|-----|---------|
| sanadflow-web | 256MB | Next.js + Apollo + Redis |
| sanadflow-db | 256MB | PostgreSQL 16 (64MB shared_buffers) |
| sanadflow-services | 256MB | PgBouncer + backup cron |

**Memory Budget (sanadflow-db):**
```
Total RAM: 256MB
├── PostgreSQL base: 80MB
├── shared_buffers: 64MB
├── OS kernel: 30MB
├── Connection overhead: 50MB
├── WAL buffers: 16MB
└── Safety margin: 16MB
```

## Acceptance Criteria
- [ ] `fly.toml` configured for Singapore region
- [ ] PostgreSQL 16 deployed with 64MB shared_buffers
- [ ] PgBouncer running in session mode (50 max clients)
- [ ] Health check endpoint returns HTTP 200
- [ ] DATABASE_URL environment variable set correctly
- [ ] Daily backup workflow created in GitHub Actions

## Technical Notes
```toml
# fly.toml
app = "sanadflow-web"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  REDIS_URL = "redis://localhost:6379"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.http_checks]]
    interval = "10s"
    path = "/api/health"
    timeout = "2s"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

## Dependencies
- Fly.io account created
- flyctl CLI installed
- GitHub repo with Dockerfile
- Domain configured (optional)
