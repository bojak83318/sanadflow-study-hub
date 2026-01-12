# Perplexity AI Prompts for COPRO Golden Examples

Use these prompts in Perplexity AI to gather high-quality examples for training the COPRO optimization loop.

---

## 🔴 CRITICAL: System Prompt (Use This First)

**Copy this system prompt before each query session:**

```
You are a senior full-stack engineer with deep expertise in:
1. Arabic RTL text handling in web applications
2. PostgreSQL full-text search for non-Latin languages
3. Real-time collaborative editing (CRDT/Yjs)
4. Zero-cost deployment on Fly.io/Koyeb
5. TLDraw whiteboard integration

I am building "SanadFlow Study Hub" - an Islamic Sciences collaborative platform for 5-10 students to study Nahw (Arabic grammar), Hadith, and Usul al-Fiqh.

Tech Stack:
- Frontend: Next.js 14, React 18, TLDraw 1.29.2
- Backend: Apollo GraphQL 4.9, Prisma 5.7, Node.js 18
- Database: PostgreSQL 16 with Arabic FTS
- Real-time: Yjs CRDT
- Hosting: Fly.io/Koyeb (256MB VMs, $0 budget)

When providing examples:
1. Include COMPLETE, RUNNABLE code (not snippets)
2. Show error handling and edge cases
3. Include TypeScript types where applicable
4. Explain WHY the pattern works
5. Cite source repositories or documentation
```

---

## 1. Backend Engineer Examples

### Prompt 1: GraphQL Resolver with Arabic FTS
```
Search for production-quality Apollo GraphQL resolver examples that implement PostgreSQL full-text search for Arabic/RTL text. Include:
- Prisma ORM integration
- GIN index usage for Arabic tsvector
- Mixed language search (Arabic + English)
- Response time optimization patterns
- Error handling for encoding issues

Focus on Islamic text databases, hadith catalogs, or Arabic content management systems.
```

### Prompt 2: Yjs CRDT Real-time Collaboration
```
Find production examples of Yjs CRDT implementation for real-time collaborative document editing. Include:
- Apollo GraphQL subscriptions for sync
- Conflict resolution patterns
- Cursor position broadcasting
- Auto-save implementation (10-second intervals)
- PostgreSQL persistence of Yjs documents

Target: Notion-like or Confluence-like collaborative editors.
```

---

## 2. Frontend Engineer Examples

### Prompt 1: Arabic RTL Text Handling in React
```
Search for React component patterns that handle bidirectional Arabic-English text without cursor jumping bugs. Include:
- dir="rtl" attribute usage
- Mixed inline text (Arabic with English terms)
- contenteditable with RTL support
- Mobile keyboard handling for Arabic
- Unicode normalization for Arabic text

Focus on production apps: Islamic content platforms, Arabic news sites, Quran applications.
```

### Prompt 2: TLDraw Whiteboard Integration
```
Find examples of TLDraw v1.x integration in Next.js/React applications for diagramming. Include:
- Custom shape creation (for grammar trees)
- Text boxes with non-Latin fonts
- Real-time collaboration via Yjs
- PNG/SVG export with text preservation
- Canvas state persistence to database

Target: Educational diagramming, flowchart builders, mind mapping tools.
```

---

## 3. DevOps Engineer Examples

### Prompt 1: Fly.io Zero-Cost Deployment
```
Search for Fly.io deployment patterns for Node.js/Next.js applications on free tier (256MB RAM). Include:
- fly.toml configuration for Singapore region
- PostgreSQL sidecar with memory constraints
- PgBouncer connection pooling setup
- Health check endpoint implementation
- GitHub Actions for automated deployment

Focus on production-grade but cost-optimized stacks.
```

### Prompt 2: PostgreSQL Backup Automation
```
Find GitHub Actions workflow examples for automated PostgreSQL backups. Include:
- pg_dump with compression
- Scheduling (cron at specific timezone)
- Artifact storage (GitHub or S3/R2)
- Retention policies (daily/weekly/monthly)
- Slack/Discord notifications on failure

Target: Small team backup strategies, startups, indie projects.
```

---

## 4. QA Engineer Examples

### Prompt 1: RTL Text Testing Patterns
```
Search for Playwright or Cypress test patterns specifically for Arabic/RTL text validation. Include:
- Cursor position assertions
- Text direction verification
- Mixed language input testing
- Mobile viewport RTL tests
- Screenshot comparison for RTL layouts

Focus on production test suites from Arabic apps or i18n testing frameworks.
```

### Prompt 2: k6 Load Testing for GraphQL APIs
```
Find k6 load testing script examples for GraphQL applications. Include:
- Authentication flow simulation
- GraphQL mutation/query patterns
- Threshold definitions (p95, error rate)
- VU (virtual user) ramping strategies
- WebSocket/subscription load testing

Target: 10-50 concurrent user scenarios, API performance benchmarks.
```

---

## 5. Product Manager Examples

### Prompt 1: Arabic-First Product Requirements
```
Search for PRD examples for Arabic-first or bilingual web applications. Include:
- RTL user interface requirements
- Arabic text input acceptance criteria
- Mobile-first responsive requirements
- Islamic content platform specifications
- Internationalization (i18n) patterns

Focus on Notion-alternatives, collaborative knowledge bases, or educational platforms.
```

### Prompt 2: Zero-Budget MVP Planning
```
Find examples of MVP planning documents for zero-cost or minimal-cost deployments. Include:
- Free tier service selection criteria
- Go/No-Go gate definitions
- Phased rollout milestones
- User onboarding strategies for < 20 users
- Cost/benefit analysis templates

Target: Indie projects, student teams, non-profit tech initiatives.
```

---

## Usage Instructions

1. Copy each prompt into [Perplexity AI](https://www.perplexity.ai/)
2. Review the results and extract:
   - Code snippets
   - Configuration examples
   - Test patterns
   - Architecture decisions
3. Save relevant examples to `golden-examples/{role}/` as `.example.md` files
4. Format with frontmatter: `id`, `difficulty`, `tags`, `source_url`
