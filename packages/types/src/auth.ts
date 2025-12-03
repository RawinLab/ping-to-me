export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
  role?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}
