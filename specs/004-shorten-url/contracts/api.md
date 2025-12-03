# API Contracts: Create Shortened URL

**Feature**: Create Shortened URL
**Status**: Draft

## Shared Types

```typescript
// packages/types/src/links.ts

export interface CreateLinkDto {
  originalUrl: string;
  slug?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expirationDate?: string; // ISO Date
  password?: string;
  redirectType?: 301 | 302;
  deepLinkFallback?: string;
}

export interface LinkResponse {
  id: string;
  originalUrl: string;
  slug: string;
  shortUrl: string; // Constructed full URL
  qrCode?: string; // Data URI
  title?: string;
  tags: string[];
  status: "ACTIVE" | "EXPIRED" | "DISABLED" | "BANNED";
  createdAt: string;
}
```

## NestJS API Endpoints

### `POST /links`

Create a new short link.

**Request**: `CreateLinkDto`

```json
{
  "originalUrl": "https://example.com/very/long/url",
  "slug": "custom-alias",
  "tags": ["marketing"],
  "redirectType": 301
}
```

**Response**: `LinkResponse`

- `201 Created`: Success.
- `400 Bad Request`: Invalid URL, Reserved Slug, or Validation Error.
- `409 Conflict`: Slug already exists.
- `403 Forbidden`: Domain is blocked.

### `GET /links`

List user's links.

**Query Params**:

- `page`: number
- `limit`: number
- `tag`: string (filter)
- `search`: string (search title/url)

**Response**:

- `200 OK`: `{ data: LinkResponse[], meta: PaginationMeta }`

### `GET /links/:id`

Get details of a specific link.

**Response**:

- `200 OK`: `LinkResponse`
- `404 Not Found`

### `PATCH /links/:id`

Update a link.

**Request**: Partial `CreateLinkDto`

**Response**:

- `200 OK`: `LinkResponse`

### `DELETE /links/:id`

Delete a link.

**Response**:

- `200 OK`: Success
