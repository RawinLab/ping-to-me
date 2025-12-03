# Data Model: Create Shortened URL

**Feature**: Create Shortened URL
**Status**: Draft

## Entities

### Link

Represents a shortened URL.

| Field              | Type         | Description                                   |
| ------------------ | ------------ | --------------------------------------------- |
| `id`               | `String`     | Unique identifier (CUID)                      |
| `originalUrl`      | `String`     | The destination URL (max 2048 chars)          |
| `slug`             | `String`     | The unique short identifier (indexed, unique) |
| `title`            | `String?`    | Optional display name                         |
| `description`      | `String?`    | Optional description                          |
| `tags`             | `String[]`   | Array of tags                                 |
| `campaignId`       | `String?`    | Optional campaign ID                          |
| `folderId`         | `String?`    | Optional folder ID                            |
| `expirationDate`   | `DateTime?`  | Auto-disable date                             |
| `passwordHash`     | `String?`    | Hashed password for protection                |
| `redirectType`     | `Int`        | 301 or 302 (default 301)                      |
| `deepLinkFallback` | `String?`    | Mobile app fallback URL                       |
| `userId`           | `String`     | Owner (Foreign Key)                           |
| `status`           | `LinkStatus` | ACTIVE, EXPIRED, DISABLED, BANNED             |
| `createdAt`        | `DateTime`   | Creation timestamp                            |
| `updatedAt`        | `DateTime`   | Last update timestamp                         |

### BlockedDomain

Represents a domain that is blacklisted.

| Field       | Type       | Description                               |
| ----------- | ---------- | ----------------------------------------- |
| `id`        | `String`   | Unique identifier (CUID)                  |
| `domain`    | `String`   | The domain to block (e.g., "example.com") |
| `reason`    | `String?`  | Reason for blocking                       |
| `createdAt` | `DateTime` | Creation timestamp                        |

## Prisma Schema Updates

```prisma
model Link {
  id               String    @id @default(cuid())
  originalUrl      String    @db.VarChar(2048)
  slug             String    @unique
  title            String?   @db.VarChar(200)
  description      String?   @db.Text
  tags             String[]

  // Metadata
  expirationDate   DateTime?
  passwordHash     String?
  redirectType     Int       @default(301) // 301 or 302
  deepLinkFallback String?   @db.VarChar(2048)

  // Relations
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Organization/Campaign placeholders (future)
  // campaignId    String?
  // folderId      String?

  status           LinkStatus @default(ACTIVE)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  @@index([userId])
  @@index([tags])
}

model BlockedDomain {
  id        String   @id @default(cuid())
  domain    String   @unique
  reason    String?
  createdAt DateTime @default(now())
}

enum LinkStatus {
  ACTIVE
  EXPIRED
  DISABLED
  BANNED
}
```
