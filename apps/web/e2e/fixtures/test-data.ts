/**
 * E2E Test Data Constants
 *
 * These constants match the seed data from packages/database/prisma/seed.ts
 * Use these for consistent testing against real database data.
 *
 * Test Users:
 * - e2e-owner@pingtome.test - Organization owner with full access
 * - e2e-admin@pingtome.test - Admin role
 * - e2e-editor@pingtome.test - Editor role (can create/edit links)
 * - e2e-viewer@pingtome.test - Viewer role (read-only)
 * - e2e-new@pingtome.test - New user for invitation tests
 */

export const TEST_CREDENTIALS = {
  owner: {
    email: "e2e-owner@pingtome.test",
    password: "TestPassword123!",
    name: "E2E Owner User",
  },
  admin: {
    email: "e2e-admin@pingtome.test",
    password: "TestPassword123!",
    name: "E2E Admin User",
  },
  editor: {
    email: "e2e-editor@pingtome.test",
    password: "TestPassword123!",
    name: "E2E Editor User",
  },
  viewer: {
    email: "e2e-viewer@pingtome.test",
    password: "TestPassword123!",
    name: "E2E Viewer User",
  },
  newUser: {
    email: "e2e-new@pingtome.test",
    password: "TestPassword123!",
    name: "E2E New User",
  },
} as const;

export const TEST_IDS = {
  users: {
    owner: "e2e00000-0000-0000-0000-000000000001",
    admin: "e2e00000-0000-0000-0000-000000000002",
    editor: "e2e00000-0000-0000-0000-000000000003",
    viewer: "e2e00000-0000-0000-0000-000000000004",
    newUser: "e2e00000-0000-0000-0000-000000000005",
  },
  organizations: {
    main: "e2e00000-0000-0000-0001-000000000001",
    secondary: "e2e00000-0000-0000-0001-000000000002",
  },
  links: {
    popular: "e2e00000-0000-0000-0002-000000000001",
    marketing: "e2e00000-0000-0000-0002-000000000002",
    social: "e2e00000-0000-0000-0002-000000000003",
    expired: "e2e00000-0000-0000-0002-000000000004",
    password: "e2e00000-0000-0000-0002-000000000005",
    recent1: "e2e00000-0000-0000-0002-000000000006",
    recent2: "e2e00000-0000-0000-0002-000000000007",
    recent3: "e2e00000-0000-0000-0002-000000000008",
    recent4: "e2e00000-0000-0000-0002-000000000009",
    recent5: "e2e00000-0000-0000-0002-000000000010",
    disabled: "e2e00000-0000-0000-0002-000000000011",
    archived: "e2e00000-0000-0000-0002-000000000012",
    banned: "e2e00000-0000-0000-0002-000000000013",
    utmLink: "e2e00000-0000-0000-0002-000000000014",
    maxClicks: "e2e00000-0000-0000-0002-000000000015",
    customDomain: "e2e00000-0000-0000-0002-000000000016",
  },
  domains: {
    verified: "e2e00000-0000-0000-0003-000000000001",
    unverified: "e2e00000-0000-0000-0003-000000000002",
    verifying: "e2e00000-0000-0000-0003-000000000003",
    failed: "e2e00000-0000-0000-0003-000000000004",
  },
  biopages: {
    main: "e2e00000-0000-0000-0004-000000000001",
    secondary: "e2e00000-0000-0000-0004-000000000002",
  },
  biolinks: {
    link1: "e2e00000-0000-0000-0004-100000000001",
    link2: "e2e00000-0000-0000-0004-100000000002",
    link3: "e2e00000-0000-0000-0004-100000000003",
    link4: "e2e00000-0000-0000-0004-100000000004",
  },
  tags: {
    marketing: "e2e00000-0000-0000-0005-000000000001",
    social: "e2e00000-0000-0000-0005-000000000002",
    campaign: "e2e00000-0000-0000-0005-000000000003",
    important: "e2e00000-0000-0000-0005-000000000004",
    temporary: "e2e00000-0000-0000-0005-000000000005",
  },
  campaigns: {
    summer: "e2e00000-0000-0000-0006-000000000001",
    winter: "e2e00000-0000-0000-0006-000000000002",
    active: "e2e00000-0000-0000-0006-000000000003",
    completed: "e2e00000-0000-0000-0006-000000000004",
  },
  folders: {
    work: "e2e00000-0000-0000-0007-000000000001",
    personal: "e2e00000-0000-0000-0007-000000000002",
    archived: "e2e00000-0000-0000-0007-000000000003",
    subFolder: "e2e00000-0000-0000-0007-000000000004",
  },
  invitations: {
    pending: "e2e00000-0000-0000-0008-000000000001",
    expired: "e2e00000-0000-0000-0008-000000000002",
    accepted: "e2e00000-0000-0000-0008-000000000003",
  },
  qrcodes: {
    popular: "e2e00000-0000-0000-0009-000000000001",
    marketing: "e2e00000-0000-0000-0009-000000000002",
    customized: "e2e00000-0000-0000-0009-000000000003",
  },
  apiKeys: {
    main: "e2e00000-0000-0000-000a-000000000001",
    expired: "e2e00000-0000-0000-000a-000000000002",
  },
  webhooks: {
    main: "e2e00000-0000-0000-000b-000000000001",
    inactive: "e2e00000-0000-0000-000b-000000000002",
  },
} as const;

export const TEST_SLUGS = {
  links: {
    popular: "e2e-popular",
    marketing: "e2e-marketing",
    social: "e2e-social",
    expired: "e2e-expired",
    password: "e2e-protected",
    recent1: "e2e-recent-1",
    recent2: "e2e-recent-2",
    recent3: "e2e-recent-3",
    recent4: "e2e-recent-4",
    recent5: "e2e-recent-5",
    disabled: "e2e-disabled",
    archived: "e2e-archived",
    banned: "e2e-banned",
    utmLink: "e2e-utm-link",
    maxClicks: "e2e-max-clicks",
    customDomain: "e2e-custom-domain",
  },
  organizations: {
    main: "e2e-test-org",
    secondary: "e2e-secondary-org",
  },
  biopages: {
    main: "e2e-profile",
    secondary: "e2e-grid-profile",
  },
  domains: {
    verified: "e2e-custom.link",
    unverified: "e2e-pending.link",
    verifying: "e2e-verifying.link",
    failed: "e2e-failed.link",
  },
  tags: {
    marketing: "marketing",
    social: "social",
    campaign: "campaign",
    important: "important",
    temporary: "temporary",
  },
  campaigns: {
    summer: "Summer Sale 2024",
    winter: "Winter Deals 2024",
    active: "Active Marketing Campaign",
    completed: "Completed Q3 Campaign",
  },
  folders: {
    work: "Work Links",
    personal: "Personal Links",
    archived: "Archived Links",
    subFolder: "Project A",
  },
} as const;

// Link status constants for testing
export const LINK_STATUSES = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",
  ARCHIVED: "ARCHIVED",
  BANNED: "BANNED",
} as const;

// Domain status constants for testing
export const DOMAIN_STATUSES = {
  PENDING: "PENDING",
  VERIFYING: "VERIFYING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
} as const;

// Campaign status constants for testing
export const CAMPAIGN_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;

// Member role constants for RBAC testing
export const MEMBER_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;

// Expected analytics data (approximate - these are generated randomly)
export const EXPECTED_ANALYTICS = {
  links: {
    popular: {
      estimatedClicks: 850,
      daysSpread: 90,
      trend: "up",
    },
    marketing: {
      estimatedClicks: 300,
      daysSpread: 90,
      trend: "steady",
    },
    social: {
      estimatedClicks: 200,
      daysSpread: 60,
      trend: "down",
    },
    utmLink: {
      estimatedClicks: 150,
      daysSpread: 30,
      trend: "up",
    },
    maxClicks: {
      estimatedClicks: 85,
      maxClicks: 100, // Near the limit
      daysSpread: 10,
    },
  },
  countries: [
    "US",
    "TH",
    "JP",
    "GB",
    "DE",
    "FR",
    "CA",
    "AU",
    "BR",
    "IN",
    "SG",
    "KR",
    "NL",
    "ES",
    "IT",
  ],
  devices: ["Mobile", "Desktop", "Tablet"],
  browsers: ["Chrome", "Safari", "Firefox", "Edge", "Opera", "Samsung Internet"],
  os: ["Windows", "macOS", "iOS", "Android", "Linux"],
  referrers: [
    "google.com",
    "facebook.com",
    "twitter.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
    "t.co",
    "reddit.com",
    "tiktok.com",
  ],
} as const;

// Bio page data for testing
export const BIO_PAGE_DATA = {
  main: {
    title: "E2E Test Profile",
    description: "A test bio page for E2E testing with multiple links",
    layout: "stacked",
    viewCount: 1250,
    linksCount: 4,
    socialLinksCount: 4,
  },
  secondary: {
    title: "E2E Grid Layout Profile",
    layout: "grid",
    viewCount: 500,
  },
} as const;

// Invitation data for testing
export const INVITATION_DATA = {
  pending: {
    email: "pending-invite@pingtome.test",
    role: "EDITOR",
    status: "pending",
  },
  expired: {
    email: "expired-invite@pingtome.test",
    role: "VIEWER",
    status: "expired",
  },
  accepted: {
    email: "e2e-admin@pingtome.test",
    role: "ADMIN",
    status: "accepted",
  },
} as const;

// Usage/Quota data for testing
export const USAGE_DATA = {
  mainOrg: {
    linksCreated: 45,
    apiCalls: 1250,
    plan: "PRO",
    limits: {
      linksPerMonth: 1000,
      apiCallsPerMonth: 10000,
    },
  },
  secondaryOrg: {
    linksCreated: 12,
    apiCalls: 0,
    plan: "FREE",
    limits: {
      linksPerMonth: 50,
      apiCallsPerMonth: 0,
    },
  },
} as const;

// Password for password-protected link
export const PROTECTED_LINK_PASSWORD = "secret123";

// API key for testing
export const API_KEY_NAME = "E2E Test API Key";

// UTM parameters for utm link
export const UTM_PARAMS = {
  source: "newsletter",
  medium: "email",
  campaign: "spring_sale",
  content: "hero_button",
  term: "discount",
} as const;

// QR Code customization data
export const QR_CODE_DATA = {
  default: {
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    size: 300,
    errorCorrection: "M",
  },
  customized: {
    foregroundColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
    size: 500,
    errorCorrection: "H",
    logoSizePercent: 25,
  },
} as const;
