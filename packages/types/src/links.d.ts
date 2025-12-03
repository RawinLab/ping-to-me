export interface CreateLinkDto {
    originalUrl: string;
    slug?: string;
    title?: string;
    description?: string;
    tags?: string[];
    expirationDate?: string;
    password?: string;
    redirectType?: 301 | 302;
    deepLinkFallback?: string;
}
export interface LinkResponse {
    id: string;
    originalUrl: string;
    slug: string;
    shortUrl: string;
    qrCode?: string;
    title?: string;
    tags: string[];
    status: 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'BANNED';
    createdAt: string;
}
export declare enum LinkStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    DISABLED = "DISABLED",
    BANNED = "BANNED"
}
//# sourceMappingURL=links.d.ts.map