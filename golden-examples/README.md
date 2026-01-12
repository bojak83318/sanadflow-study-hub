# Golden Examples Directory

This directory contains few-shot examples for COPRO skill optimization.

## Structure

```
golden-examples/
├── PERPLEXITY_PROMPTS.md    # Prompts to gather examples from Perplexity AI
├── backend/                  # GraphQL, Prisma, Arabic FTS examples
├── frontend/                 # RTL, TLDraw, React examples
├── devops/                   # Fly.io, PostgreSQL, backup examples
├── testing/                  # Playwright RTL, k6 load testing examples
└── product-manager/          # PRD templates, MVP planning examples
```

## Example Format

Each example file should follow this format:

```markdown
---
id: "example_001"
difficulty: "medium"
tags: ["graphql", "prisma", "arabic-fts"]
source_url: "https://..."
---

# Example Title

## Problem
[Description of the problem being solved]

## Solution
[Code or configuration that solves it]

## Key Learnings
[What makes this example valuable for training]
```

## Sourcing Examples

Use the prompts in `PERPLEXITY_PROMPTS.md` to gather high-quality examples from:
- Open source repositories
- Documentation and tutorials
- Stack Overflow answers
- Technical blog posts

## Quality Criteria

Good golden examples should:
1. Be runnable/verifiable code
2. Include error handling
3. Show production patterns (not demos)
4. Be relevant to SanadFlow's tech stack
5. Include inline comments explaining decisions
