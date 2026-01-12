---
id: "20260111_hadith_graphql_api"
difficulty: "medium"
tags: ["backend", "graphql", "prisma", "postgresql", "arabic-fts"]
tech_stack: "Apollo Server 4.9.5, Prisma 5.7.1, PostgreSQL 16"
---

# User Story: Hadith GraphQL API

## As a
Backend Engineer

## I want to
Implement the Hadith CRUD operations with Arabic full-text search

## So that
Researchers can catalog 500+ hadiths with structured metadata

## Context & Constraints
**Data Model:**
```typescript
interface Hadith {
  id: UUID;
  arabicText: string;      // Required, RTL text
  englishTranslation?: string;
  grading: 'SAHIH' | 'HASAN' | 'DAIF' | 'MAWDU';
  narratorIds: UUID[];     // Links to Narrator entities
  collection?: string;     // e.g., 'Sahih Bukhari'
  hadithNumber?: string;
  topicTags: string[];
}
```

**Search Requirements:**
- Arabic FTS using PostgreSQL native (70% accuracy acceptable)
- Mixed Arabic-English query support
- Response time < 500ms for 1000 records

## Acceptance Criteria
- [ ] `createHadith` mutation validates Arabic text (UTF-8)
- [ ] `searchHadiths` query uses GIN index for FTS
- [ ] `updateHadith` mutation records version in document_versions
- [ ] `deleteHadith` mutation uses soft delete (30-day trash)
- [ ] Narrator bi-directional links work correctly
- [ ] Auto-save triggers every 10 seconds via subscription

## Technical Notes
```graphql
# GraphQL Schema
type Hadith {
  id: UUID!
  arabicText: String!
  englishTranslation: String
  grading: HadithGrading
  narrators: [Narrator!]!
  collection: String
  topicTags: [String!]!
  createdAt: DateTime!
}

input SearchHadithsInput {
  workspaceId: UUID!
  query: String!
  grading: HadithGrading
  limit: Int = 20
}

type Query {
  searchHadiths(input: SearchHadithsInput!): HadithConnection!
}
```

```sql
-- PostgreSQL Arabic FTS index
CREATE INDEX idx_hadiths_arabic_fts 
ON hadiths USING gin(to_tsvector('arabic', arabic_text));
```

## Dependencies
- PostgreSQL 16 deployed with Arabic FTS extension
- Prisma schema generated
- PgBouncer connection pooling active
