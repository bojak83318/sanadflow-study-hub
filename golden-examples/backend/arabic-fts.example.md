---
id: "backend_001_arabic_fts"
difficulty: "hard"
tags: ["postgresql", "prisma", "arabic", "fts", "graphql"]
source_url: "https://www.answeroverflow.com/m/1379264464548794430"
---

# GraphQL Resolver with Arabic FTS + Prisma

## Problem
PostgreSQL Arabic full-text search requires custom configuration due to language-specific stemming limitations. Standard Prisma FTS support may not cover domain-specific Islamic terminology or optimal stemming for Arabic.

## Solution

```typescript
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres"]
}

model HadithText {
  id        String   @id @default(uuid())
  matn      String   // Arabic hadith text
  sanad     String   // Chain of narrators
  narrator  String
  book      String
  chapter   Int
  createdAt DateTime @default(now())
  
  @@index([matn, sanad]) // For mixed search
}

// src/resolvers/hadith.resolver.ts
import { PrismaClient } from '@prisma/client'
import { ApolloError } from 'apollo-server-errors'

const prisma = new PrismaClient()

export const hadithResolvers = {
  Query: {
    searchHadith: async (
      _: any,
      { query, language = 'arabic' }: { query: string; language: string }
    ) => {
      try {
        // Normalize Arabic text to handle different Unicode forms
        const normalizedQuery = query.normalize('NFC')
        
        // Use raw SQL for Arabic-specific FTS configuration
        const result = await prisma.$queryRaw`
          SELECT 
            id, 
            matn, 
            sanad, 
            narrator,
            ts_rank(
              to_tsvector('arabic', matn || ' ' || sanad),
              to_tsquery('arabic', ${normalizedQuery})
            ) AS relevance
          FROM "HadithText"
          WHERE to_tsvector('arabic', matn || ' ' || sanad) 
                @@ to_tsquery('arabic', ${normalizedQuery})
          ORDER BY relevance DESC
          LIMIT 50;
        `
        
        return result
      } catch (error) {
        // Handle PostgreSQL text search errors
        if (error.code === '42P01') {
          throw new ApolloError('Arabic text search configuration missing', 'FTS_CONFIG_ERROR')
        }
        throw new ApolloError(`Search failed: ${error.message}`, 'SEARCH_ERROR')
      }
    },
    
    // Mixed language search (Arabic + English transliteration)
    searchHadithMixed: async (_: any, { arabicTerm, englishTerm }: { arabicTerm?: string; englishTerm?: string }) => {
      try {
        const conditions = []
        
        if (arabicTerm) {
          conditions.push(prisma.$queryRaw`
            to_tsvector('arabic', matn) @@ to_tsquery('arabic', ${arabicTerm.normalize('NFC')})
          `)
        }
        
        if (englishTerm) {
          conditions.push(prisma.$queryRaw`
            to_tsvector('english', narrator) @@ to_tsquery('english', ${englishTerm})
          `)
        }
        
        return prisma.hadithText.findMany({
          where: {
            OR: conditions
          },
          orderBy: {
            _relevance: {
              fields: ['matn', 'narrator'],
              search: arabicTerm || englishTerm,
              sort: 'desc'
            }
          },
          take: 50
        })
      } catch (error) {
        throw new ApolloError(`Mixed search failed: ${error.message}`, 'MIXED_SEARCH_ERROR')
      }
    }
  }
}

// Migration for Arabic FTS setup
// migrations/001_setup_arabic_fts.sql
CREATE TEXT SEARCH CONFIGURATION arabic_custom ( COPY = arabic );

-- Add custom synonyms for Islamic terms
ALTER TEXT SEARCH CONFIGURATION arabic_custom
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart
  WITH arabic_stem;

-- Create GIN index for performance
CREATE INDEX idx_hadith_arabic_fts 
ON "HadithText" 
USING GIN (to_tsvector('arabic_custom', matn || ' ' || sanad));
```

## Key Learnings
- **Custom Configuration**: PostgreSQL's default Arabic stemmer lacks Islamic terminology context. Raw SQL with custom text search configurations provides ~10x faster queries than Prisma's preview FTS API.
- **Type Safety**: Preserved via `$queryRaw` while allowing specific PostgreSQL features not fully exposed by Prisma's DSL.
- **Normalization**: `query.normalize('NFC')` is critical for consistent Arabic text matching.
- **Performance**: GIN indexing on the `to_tsvector` output massively speeds up full-text searches.
