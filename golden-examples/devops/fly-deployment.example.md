---
id: "devops_001_fly_deploy"
difficulty: "medium"
tags: ["fly.io", "docker", "nodejs", "pgbouncer"]
source_url: "https://community.fly.io/t/please-increase-development-postgres-from-256mb-to-512mb/21204"
---

# Fly.io Zero-Cost Deployment with PgBouncer (256MB RAM Optimization)

## Problem
Deploying a Node.js/Next.js application and a PostgreSQL database on a strictly limited free tier (256MB RAM) without crashing due to memory exhaustion.

## Solution

```toml
# fly.toml
app = "sanadflow-study-hub"
primary_region = "sin" # Singapore for <50ms latency

[build]
  [build.args]
    NODE_VERSION = "18"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [[services.tcp_checks]]
    interval = "15s"
    timeout = "10s"
    grace_period = "30s"

[deploy]
  strategy = "rolling"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

# Dockerfile optimizations for 256MB RAM
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --no-audit

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install PgBouncer for connection pooling
RUN apk add --no-cache pgbouncer

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# PgBouncer configuration
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Optimize Node.js for 256MB
ENV NODE_OPTIONS="--max-old-space-size=200"

EXPOSE 8080 6432
CMD ["/start.sh"]

# pgbouncer.ini
[databases]
* = host=sanadflow-db.internal port=5432

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
pool_mode = transaction
max_client_conn = 100
default_pool_size = 10
min_pool_size = 2
reserve_pool_size = 2
max_db_connections = 15

# Aggressive connection recycling for memory
server_idle_timeout = 30
server_lifetime = 300

# start.sh
#!/bin/sh
pgbouncer /etc/pgbouncer/pgbouncer.ini -d
DATABASE_URL="postgresql://user:pass@localhost:6432/db" node server.js
```

### Prisma Optimization
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Critical for 256MB RAM
  connection_limit = 5
}
```

## Key Learnings
- **Connection Pooling**: PgBouncer is critical for low-memory environments, reducing per-connection overhead from ~10MB to ~2KB.
- **Node Optimization**: Identifying `max-old-space-size` prevents Node's V8 engine from grabbing more memory than the container allows.
- **Transaction Mode**: Using transaction-level pooling allows supporting many more concurrent users (100+) on limited hardware than session-level pooling.
