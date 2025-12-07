export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrCodeConfig {
  id: string;
  linkId: string;
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  logoSizePercent: number;
  errorCorrection: ErrorCorrectionLevel;
  borderSize: number;
  size: number;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQrConfigDto {
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string; // base64
  logoSizePercent?: number;
  errorCorrection?: ErrorCorrectionLevel;
  borderSize?: number;
  size?: number;
}

export interface UpdateQrConfigDto extends CreateQrConfigDto {}

export interface BatchDownloadDto {
  linkIds: string[];
  format?: "png" | "svg" | "pdf";
  size?: number;
}

export interface QrDownloadOptions {
  url: string;
  foregroundColor?: string;
  backgroundColor?: string;
  size?: number;
  format?: "png" | "svg" | "pdf";
  errorCorrection?: ErrorCorrectionLevel;
  borderSize?: number;
  logo?: string;
  logoSizePercent?: number;
}
