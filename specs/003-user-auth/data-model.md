# Data Model: User Authentication

**Feature**: User Authentication
**Status**: Draft

## Entities

### User

Represents a registered user of the platform.

| Field           | Type        | Description                                                              |
| --------------- | ----------- | ------------------------------------------------------------------------ |
| `id`            | `String`    | Unique identifier (CUID)                                                 |
| `name`          | `String?`   | Display name                                                             |
| `email`         | `String`    | Unique email address                                                     |
| `emailVerified` | `DateTime?` | Timestamp of email verification                                          |
| `image`         | `String?`   | Avatar URL                                                               |
| `password`      | `String?`   | Hashed password (null for OAuth-only users)                              |
| `role`          | `Role`      | RBAC Role (OWNER, ADMIN, MEMBER) - Default: OWNER for personal workspace |
| `createdAt`     | `DateTime`  | Creation timestamp                                                       |
| `updatedAt`     | `DateTime`  | Last update timestamp                                                    |

### Account

Represents an OAuth provider link (NextAuth.js standard).

| Field               | Type      | Description                               |
| ------------------- | --------- | ----------------------------------------- |
| `id`                | `String`  | Unique identifier (CUID)                  |
| `userId`            | `String`  | Foreign key to User                       |
| `type`              | `String`  | Provider type (oauth, email, credentials) |
| `provider`          | `String`  | Provider ID (google, github, facebook)    |
| `providerAccountId` | `String`  | Provider's unique user ID                 |
| `refresh_token`     | `String?` | OAuth refresh token                       |
| `access_token`      | `String?` | OAuth access token                        |
| `expires_at`        | `Int?`    | Token expiration timestamp                |
| `token_type`        | `String?` | OAuth token type                          |
| `scope`             | `String?` | OAuth scope                               |
| `id_token`          | `String?` | OIDC ID token                             |
| `session_state`     | `String?` | OAuth session state                       |

### VerificationToken

Used for Magic Links and Email Verification (NextAuth.js standard).

| Field        | Type       | Description          |
| ------------ | ---------- | -------------------- |
| `identifier` | `String`   | Email address        |
| `token`      | `String`   | Unique token         |
| `expires`    | `DateTime` | Expiration timestamp |

## Prisma Schema Updates

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(OWNER)
  accounts      Account[]
  sessions      Session[] // Optional if using database sessions

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Existing relations...
  // organizations Organization[]
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}
```
