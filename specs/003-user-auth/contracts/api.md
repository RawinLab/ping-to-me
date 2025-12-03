# API Contracts: User Authentication

**Feature**: User Authentication
**Status**: Draft

The **NestJS API** handles all authentication using Passport.js strategies and JWTs.

## Shared Types

```typescript
// packages/types/src/auth.ts

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: UserProfile;
}
```

## NestJS API Endpoints (Backend)

The API uses `Authorization: Bearer <token>` header for protected routes.
Refresh tokens are stored in `httpOnly` cookies.

### `POST /auth/register`

Register a new user with email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response**:

- `201 Created`: `UserProfile`
- `400 Bad Request`: Validation error or email exists.

### `POST /auth/login`

Login with email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:

- `201 Created`: `AuthResponse` (Sets `refresh_token` cookie)
- `401 Unauthorized`: Invalid credentials.

### `POST /auth/refresh`

Refresh the access token using the httpOnly cookie.

**Request**:

- Cookie: `refresh_token=...`

**Response**:

- `201 Created`: `{ accessToken: "..." }`
- `401 Unauthorized`: Invalid or missing refresh token.

### `POST /auth/logout`

Logout the user by clearing the refresh token cookie.

**Response**:

- `201 Created`: `{ message: "Logged out successfully" }`

### `GET /auth/google`

Initiate Google OAuth flow.

**Response**:

- Redirects to Google Consent Screen.

### `GET /auth/github`

Initiate GitHub OAuth flow.

**Response**:

- Redirects to GitHub Consent Screen.

### `POST /auth/verify-email`

Verify user email address.

**Request**:

```json
{
  "token": "verification_token_string"
}
```

**Response**:

- `201 Created`: `{ message: "Email verified" }`
- `400 Bad Request`: Invalid token.
