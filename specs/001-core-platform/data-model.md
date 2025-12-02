# Data Model: Core Platform

**Database**: PostgreSQL (Supabase)
**ORM**: Prisma

## Schema Overview

```mermaid
erDiagram
    User ||--o{ OrganizationMember : "belongs to"
    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o{ Link : "owns"
    Organization ||--o{ Domain : "owns"
    Link ||--o{ ClickEvent : "generates"
    Link ||--o{ QrCode : "has"

    User {
        uuid id PK
        string email UK
        string password_hash
        string name
        string avatar_url
        timestamp created_at
    }

    Organization {
        uuid id PK
        string slug UK
        string name
        string plan "FREE|PRO|ENTERPRISE"
        timestamp created_at
    }

    OrganizationMember {
        uuid user_id FK
        uuid organization_id FK
        string role "OWNER|ADMIN|EDITOR|VIEWER"
    }

    Link {
        uuid id PK
        string slug UK
        string destination_url
        uuid organization_id FK
        uuid creator_id FK
        boolean is_active
        timestamp expires_at
        jsonb tags
        timestamp created_at
    }

    ClickEvent {
        uuid id PK
        uuid link_id FK
        timestamp timestamp
        string ip_address
        string country
        string city
        string device_type
        string browser
        string os
        string referrer
    }

    Domain {
        uuid id PK
        string hostname UK
        uuid organization_id FK
        boolean is_verified
        timestamp created_at
    }
```

## Prisma Schema (Draft)

```prisma
model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())

  memberships OrganizationMember[]
}

model Organization {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug      String   @unique
  name      String
  plan      PlanType @default(FREE)
  createdAt DateTime @default(now())

  members   OrganizationMember[]
  links     Link[]
  domains   Domain[]
}

model OrganizationMember {
  userId         String       @db.Uuid
  organizationId String       @db.Uuid
  role           MemberRole   @default(VIEWER)

  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@id([userId, organizationId])
}

model Link {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug           String    @unique
  destinationUrl String
  organizationId String    @db.Uuid
  creatorId      String    @db.Uuid
  isActive       Boolean   @default(true)
  expiresAt      DateTime?
  tags           String[]
  createdAt      DateTime  @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  clicks         ClickEvent[]
}

model ClickEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  linkId    String   @db.Uuid
  timestamp DateTime @default(now())
  ip        String?
  country   String?
  city      String?
  device    String?
  browser   String?
  os        String?
  referrer  String?

  link      Link     @relation(fields: [linkId], references: [id])
}

enum MemberRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

enum PlanType {
  FREE
  PRO
  ENTERPRISE
}
```
