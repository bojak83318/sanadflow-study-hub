# SanadFlow Study Hub - COPRO Optimization Project

## 1. Project Overview
**Project Name:** SanadFlow Study Hub (QalamColab)
**Goal:** Build a zero-pilot-cost Islamic Sciences collaborative platform enabling 5-10 students to study Nahw, Hadith, and Usul al-Fiqh with real-time editing, Arabic RTL support, and visual diagramming.
**Core Innovation:** AFFiNE-based knowledge management with PostgreSQL Arabic full-text search and TLDraw whiteboard for I'rab sentence trees.

## 2. Current Status
**Type:** Design & Implementation Repository
**Status:** Phase 0 - RTL Validation (Go/No-Go Gate)
**Phase:** Week 1 - Infrastructure Setup

## 3. Key Documentation
- **`docs/PRD_2.0.md`**: Product requirements, user personas, success metrics
- **`docs/ADD_V2.0.md`**: Architecture design, deployment topology
- **`docs/TDD_v2.0.md`**: Technical specs, database schemas, API contracts

## 4. Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 + React 18 | SSR application |
| Backend | Apollo GraphQL + Node.js 18 | API layer |
| Database | PostgreSQL 16 | Hadith/Narrator storage |
| ORM | Prisma 5.7.1 | Type-safe queries |
| Whiteboard | TLDraw 1.29.2 | I'rab sentence diagrams |
| Real-time | Yjs CRDT | Collaborative editing |
| Hosting | Fly.io/Koyeb | Zero-cost deployment |
| Storage | Cloudflare R2 | Media offloading |

## 5. Directory Structure
```
qalamcolab/
├── docs/                    # PRD, ADD, TDD documentation
├── skills/                  # COPRO agent personas
│   ├── backend-engineer/    # GraphQL/Prisma implementation
│   ├── frontend-engineer/   # React/RTL/TLDraw UI
│   ├── devops-engineer/     # Fly.io/Koyeb deployment
│   ├── qa-engineer/         # RTL testing, load testing
│   └── product-manager/     # Requirements, governance
├── stories/                 # Implementation user stories
│   ├── infrastructure/      # Deployment stories
│   ├── backend/             # API/database stories
│   ├── frontend/            # UI/RTL stories
│   └── testing/             # QA stories
├── golden-examples/         # Few-shot COPRO examples
│   ├── backend/             # GraphQL resolver examples
│   ├── frontend/            # RTL component examples
│   └── devops/              # Deployment examples
└── src/                     # Implementation (TBD)
```

## 6. Key Constraints
| Constraint | Threshold | Enforcement |
|------------|-----------|-------------|
| Pilot Cost | $0/month | Free tier selection |
| RAM per VM | 256MB | Memory optimization |
| RTL Pass Rate | ≥ 90% (45/50 tests) | Go/No-Go gate |
| Page Load | < 2s (p95) | Performance testing |
| Uptime SLA | 99.5% | UptimeRobot monitoring |

## 7. Phase Roadmap
| Phase | Scope | Timeline |
|-------|-------|----------|
| Phase 0 | RTL Validation | Days 1-2 |
| Phase 1 | Infrastructure | Days 3-5 |
| Phase 2 | Load Testing | Week 2 |
| Phase 3 | User Onboarding | Week 3 |
| Phase 4 | Production | Week 4+ |

## 8. Usage Guidelines
- **For Context**: Refer to `docs/PRD_2.0.md` for requirements
- **For Architecture**: Use `docs/ADD_V2.0.md` for system design
- **For Implementation**: Use `docs/TDD_v2.0.md` as technical blueprint
- **For Skills**: Reference `skills/` for persona-specific patterns
