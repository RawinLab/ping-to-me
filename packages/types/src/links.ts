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
  organizationId?: string; // Organization this link belongs to
  domainId?: string; // Custom domain for this link (TASK-2.4.15)
  // QR Code customization
  qrColor?: string; // Hex color for QR code foreground
  qrLogo?: string; // Base64 encoded image for logo overlay
  generateQrCode?: boolean; // Whether to generate QR code (default: true)
}

export interface LinkResponse {
  id: string;
  originalUrl: string;
  slug: string;
  shortUrl: string; // Constructed full URL
  qrCode?: string; // Data URI
  title?: string;
  tags: string[];
  status: "ACTIVE" | "EXPIRED" | "DISABLED" | "ARCHIVED" | "BANNED";
  createdAt: string;
  createdById?: string; // User ID who created the link
  clicks?: number; // Engagement count
}

export enum LinkStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  DISABLED = "DISABLED",
  ARCHIVED = "ARCHIVED",
  BANNED = "BANNED",
}
