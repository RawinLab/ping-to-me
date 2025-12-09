-- CreateEnum
CREATE TYPE "AccessResult" AS ENUM ('ALLOWED', 'DENIED');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('PENDING', 'PROVISIONING', 'ACTIVE', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClickSource" AS ENUM ('DIRECT', 'QR', 'API');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable - Add missing columns to Session
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "deviceInfo" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tokenFamily" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);

-- AlterTable - Add missing columns to Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "dataRetentionDays" INTEGER DEFAULT 90;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "defaultDomainId" UUID;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable - Add missing columns to OrganizationMember
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "invitedById" UUID;

-- AlterTable - Add missing columns to Link
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "maxClicks" INTEGER;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "domainId" UUID;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "safetyStatus" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "safetyCheckDate" TIMESTAMP(3);
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "safetyThreats" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Update LinkStatus enum to add ARCHIVED if not exists
DO $$ BEGIN
    ALTER TYPE "LinkStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable - Add missing columns to ClickEvent
ALTER TABLE "ClickEvent" ADD COLUMN IF NOT EXISTS "source" "ClickSource" DEFAULT 'DIRECT';
ALTER TABLE "ClickEvent" ADD COLUMN IF NOT EXISTS "sessionId" VARCHAR(64);

-- AlterTable - Add missing columns to Domain
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "status" "DomainStatus" DEFAULT 'PENDING';
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "verificationType" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "verificationAttempts" INTEGER DEFAULT 0;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "lastVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "lastCheckAt" TIMESTAMP(3);
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "verificationError" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslStatus" "SslStatus" DEFAULT 'PENDING';
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslProvider" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslCertificateId" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslIssuedAt" TIMESTAMP(3);
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslExpiresAt" TIMESTAMP(3);
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "sslAutoRenew" BOOLEAN DEFAULT true;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable - Add missing columns to Campaign
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "status" "CampaignStatus" DEFAULT 'DRAFT';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "goalType" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "goalTarget" INTEGER;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;

-- AlterTable - Add missing columns to Folder
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "organizationId" UUID;
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "parentId" UUID;
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN DEFAULT false;
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- AlterTable - Add missing columns to AuditLog
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'success';
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "changes" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "geoLocation" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;

-- AlterTable - Add missing columns to ApiKey
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "rateLimit" INTEGER;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- AlterTable - Add missing columns to BioPage
ALTER TABLE "BioPage" ADD COLUMN IF NOT EXISTS "layout" TEXT DEFAULT 'stacked';
ALTER TABLE "BioPage" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "BioPage" ADD COLUMN IF NOT EXISTS "showBranding" BOOLEAN DEFAULT true;
ALTER TABLE "BioPage" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT true;
ALTER TABLE "BioPage" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;

-- CreateTable - BackupCode
CREATE TABLE IF NOT EXISTS "BackupCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable - TrustedDevice
CREATE TABLE IF NOT EXISTS "TrustedDevice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable - LoginAttempt
CREATE TABLE IF NOT EXISTS "LoginAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable - OrganizationSettings
CREATE TABLE IF NOT EXISTS "OrganizationSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "ipAllowlist" JSONB,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ssoProviderId" TEXT,
    "enforced2FA" BOOLEAN NOT NULL DEFAULT false,
    "enforce2FAForRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDuration" INTEGER NOT NULL DEFAULT 30,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 7200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable - OrganizationInvitation
CREATE TABLE IF NOT EXISTS "OrganizationInvitation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "tokenHash" TEXT,
    "invitedById" UUID NOT NULL,
    "personalMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable - BioPageLink
CREATE TABLE IF NOT EXISTS "BioPageLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bioPageId" UUID NOT NULL,
    "linkId" UUID,
    "externalUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "thumbnailUrl" TEXT,
    "buttonColor" TEXT,
    "textColor" TEXT,
    "order" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioPageLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable - BioPageAnalytics
CREATE TABLE IF NOT EXISTS "BioPageAnalytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bioPageId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "bioLinkId" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "BioPageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable - QrCode
CREATE TABLE IF NOT EXISTS "QrCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkId" UUID NOT NULL,
    "foregroundColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "logoUrl" TEXT,
    "logoSizePercent" INTEGER NOT NULL DEFAULT 20,
    "errorCorrection" TEXT NOT NULL DEFAULT 'M',
    "borderSize" INTEGER NOT NULL DEFAULT 2,
    "size" INTEGER NOT NULL DEFAULT 300,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable - RedirectRule
CREATE TABLE IF NOT EXISTS "RedirectRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkId" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "devices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "browsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "os" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dateRange" JSONB,
    "timeRange" JSONB,
    "targetUrl" VARCHAR(2048) NOT NULL,
    "redirectType" INTEGER NOT NULL DEFAULT 302,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable - LinkVariant
CREATE TABLE IF NOT EXISTS "LinkVariant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "targetUrl" VARCHAR(2048) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable - AnalyticsDaily
CREATE TABLE IF NOT EXISTS "analytics_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "countries" JSONB,
    "devices" JSONB,
    "browsers" JSONB,
    "os" JSONB,
    "referrers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable - AccessLog
CREATE TABLE IF NOT EXISTS "AccessLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "apiKeyId" UUID,
    "organizationId" UUID,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" "AccessResult" NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable - PlanDefinition
CREATE TABLE IF NOT EXISTS "plan_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "linksPerMonth" INTEGER NOT NULL,
    "customDomains" INTEGER NOT NULL,
    "teamMembers" INTEGER NOT NULL,
    "apiCallsPerMonth" INTEGER NOT NULL,
    "analyticsRetentionDays" INTEGER NOT NULL,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2) NOT NULL,
    "features" TEXT[],
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable - UsageTracking
CREATE TABLE IF NOT EXISTS "usage_tracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "linksCreated" INTEGER NOT NULL DEFAULT 0,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable - UsageEvent
CREATE TABLE IF NOT EXISTS "usage_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable - ReportSchedule
CREATE TABLE IF NOT EXISTS "ReportSchedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "linkId" UUID,
    "frequency" "ReportFrequency" NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "time" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "recipients" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable - SSOProvider
CREATE TABLE IF NOT EXISTS "SSOProvider" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'SAML SSO',
    "type" TEXT NOT NULL DEFAULT 'saml',
    "entityId" TEXT NOT NULL,
    "ssoUrl" TEXT NOT NULL,
    "sloUrl" TEXT,
    "certificate" TEXT NOT NULL,
    "spEntityId" TEXT,
    "spAcsUrl" TEXT,
    "signRequests" BOOLEAN NOT NULL DEFAULT false,
    "signatureAlgorithm" TEXT NOT NULL DEFAULT 'sha256',
    "nameIdFormat" TEXT NOT NULL DEFAULT 'emailAddress',
    "emailAttribute" TEXT NOT NULL DEFAULT 'email',
    "nameAttribute" TEXT DEFAULT 'displayName',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSOProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Passkey
CREATE TABLE IF NOT EXISTS "Passkey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "authenticatorType" TEXT NOT NULL DEFAULT 'platform',
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aaguid" TEXT,
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - Session
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");
CREATE INDEX IF NOT EXISTS "Session_tokenFamily_idx" ON "Session"("tokenFamily");
CREATE INDEX IF NOT EXISTS "Session_tokenHash_idx" ON "Session"("tokenHash");

-- CreateIndex - BackupCode
CREATE INDEX IF NOT EXISTS "BackupCode_userId_idx" ON "BackupCode"("userId");

-- CreateIndex - TrustedDevice
CREATE UNIQUE INDEX IF NOT EXISTS "TrustedDevice_userId_fingerprint_key" ON "TrustedDevice"("userId", "fingerprint");
CREATE INDEX IF NOT EXISTS "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");
CREATE INDEX IF NOT EXISTS "TrustedDevice_fingerprint_idx" ON "TrustedDevice"("fingerprint");

-- CreateIndex - LoginAttempt
CREATE INDEX IF NOT EXISTS "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex - OrganizationSettings
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- CreateIndex - OrganizationInvitation
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationInvitation_organizationId_email_key" ON "OrganizationInvitation"("organizationId", "email");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_token_idx" ON "OrganizationInvitation"("token");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_tokenHash_idx" ON "OrganizationInvitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_expiresAt_idx" ON "OrganizationInvitation"("expiresAt");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex - OrganizationMember
CREATE INDEX IF NOT EXISTS "OrganizationMember_invitedById_idx" ON "OrganizationMember"("invitedById");

-- CreateIndex - BioPageLink
CREATE INDEX IF NOT EXISTS "BioPageLink_bioPageId_order_idx" ON "BioPageLink"("bioPageId", "order");

-- CreateIndex - BioPageAnalytics
CREATE INDEX IF NOT EXISTS "BioPageAnalytics_bioPageId_timestamp_idx" ON "BioPageAnalytics"("bioPageId", "timestamp");
CREATE INDEX IF NOT EXISTS "BioPageAnalytics_bioPageId_eventType_idx" ON "BioPageAnalytics"("bioPageId", "eventType");

-- CreateIndex - QrCode
CREATE UNIQUE INDEX IF NOT EXISTS "QrCode_linkId_key" ON "QrCode"("linkId");

-- CreateIndex - RedirectRule
CREATE INDEX IF NOT EXISTS "RedirectRule_linkId_priority_idx" ON "RedirectRule"("linkId", "priority");

-- CreateIndex - LinkVariant
CREATE INDEX IF NOT EXISTS "LinkVariant_linkId_idx" ON "LinkVariant"("linkId");

-- CreateIndex - ClickEvent
CREATE INDEX IF NOT EXISTS "ClickEvent_linkId_sessionId_idx" ON "ClickEvent"("linkId", "sessionId");
CREATE INDEX IF NOT EXISTS "ClickEvent_linkId_timestamp_idx" ON "ClickEvent"("linkId", "timestamp");

-- CreateIndex - AnalyticsDaily
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_linkId_date_key" ON "analytics_daily"("linkId", "date");
CREATE INDEX IF NOT EXISTS "analytics_daily_linkId_idx" ON "analytics_daily"("linkId");
CREATE INDEX IF NOT EXISTS "analytics_daily_date_idx" ON "analytics_daily"("date");

-- CreateIndex - Domain
CREATE INDEX IF NOT EXISTS "Domain_organizationId_idx" ON "Domain"("organizationId");
CREATE INDEX IF NOT EXISTS "Domain_status_idx" ON "Domain"("status");

-- CreateIndex - AccessLog
CREATE INDEX IF NOT EXISTS "AccessLog_userId_idx" ON "AccessLog"("userId");
CREATE INDEX IF NOT EXISTS "AccessLog_organizationId_idx" ON "AccessLog"("organizationId");
CREATE INDEX IF NOT EXISTS "AccessLog_result_idx" ON "AccessLog"("result");
CREATE INDEX IF NOT EXISTS "AccessLog_resource_idx" ON "AccessLog"("resource");
CREATE INDEX IF NOT EXISTS "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex - AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_resource_idx" ON "AuditLog"("resource");
CREATE INDEX IF NOT EXISTS "AuditLog_status_idx" ON "AuditLog"("status");

-- CreateIndex - PlanDefinition
CREATE UNIQUE INDEX IF NOT EXISTS "plan_definitions_name_key" ON "plan_definitions"("name");

-- CreateIndex - UsageTracking
CREATE UNIQUE INDEX IF NOT EXISTS "usage_tracking_organizationId_yearMonth_key" ON "usage_tracking"("organizationId", "yearMonth");
CREATE INDEX IF NOT EXISTS "usage_tracking_organizationId_idx" ON "usage_tracking"("organizationId");
CREATE INDEX IF NOT EXISTS "usage_tracking_yearMonth_idx" ON "usage_tracking"("yearMonth");

-- CreateIndex - UsageEvent
CREATE INDEX IF NOT EXISTS "usage_events_organizationId_createdAt_idx" ON "usage_events"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "usage_events_eventType_createdAt_idx" ON "usage_events"("eventType", "createdAt");

-- CreateIndex - ReportSchedule
CREATE INDEX IF NOT EXISTS "ReportSchedule_userId_idx" ON "ReportSchedule"("userId");
CREATE INDEX IF NOT EXISTS "ReportSchedule_nextRunAt_idx" ON "ReportSchedule"("nextRunAt");
CREATE INDEX IF NOT EXISTS "ReportSchedule_enabled_idx" ON "ReportSchedule"("enabled");

-- CreateIndex - SSOProvider
CREATE UNIQUE INDEX IF NOT EXISTS "SSOProvider_organizationId_key" ON "SSOProvider"("organizationId");
CREATE INDEX IF NOT EXISTS "SSOProvider_organizationId_idx" ON "SSOProvider"("organizationId");

-- CreateIndex - Passkey
CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credentialId_key" ON "Passkey"("credentialId");
CREATE INDEX IF NOT EXISTS "Passkey_userId_idx" ON "Passkey"("userId");
CREATE INDEX IF NOT EXISTS "Passkey_authenticatorType_idx" ON "Passkey"("authenticatorType");
CREATE INDEX IF NOT EXISTS "Passkey_credentialId_idx" ON "Passkey"("credentialId");

-- CreateIndex - Folder
CREATE UNIQUE INDEX IF NOT EXISTS "Folder_organizationId_name_parentId_key" ON "Folder"("organizationId", "name", "parentId");
CREATE INDEX IF NOT EXISTS "Folder_organizationId_idx" ON "Folder"("organizationId");

-- AddForeignKey - BackupCode
ALTER TABLE "BackupCode" ADD CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - TrustedDevice
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - OrganizationSettings
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - OrganizationInvitation
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey - OrganizationMember
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey - Link
ALTER TABLE "Link" ADD CONSTRAINT "Link_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey - BioPageLink
ALTER TABLE "BioPageLink" ADD CONSTRAINT "BioPageLink_bioPageId_fkey" FOREIGN KEY ("bioPageId") REFERENCES "BioPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BioPageLink" ADD CONSTRAINT "BioPageLink_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey - BioPageAnalytics
ALTER TABLE "BioPageAnalytics" ADD CONSTRAINT "BioPageAnalytics_bioPageId_fkey" FOREIGN KEY ("bioPageId") REFERENCES "BioPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - QrCode
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - RedirectRule
ALTER TABLE "RedirectRule" ADD CONSTRAINT "RedirectRule_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - LinkVariant
ALTER TABLE "LinkVariant" ADD CONSTRAINT "LinkVariant_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - AnalyticsDaily
ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - Folder
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - UsageTracking
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - ReportSchedule
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - SSOProvider
ALTER TABLE "SSOProvider" ADD CONSTRAINT "SSOProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey - Passkey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old unique constraint on Folder if exists and create new one
DO $$ BEGIN
    ALTER TABLE "Folder" DROP CONSTRAINT IF EXISTS "Folder_userId_name_key";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;
