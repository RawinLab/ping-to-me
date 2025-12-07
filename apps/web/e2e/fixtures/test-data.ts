/**
 * E2E Test Data Constants
 *
 * These constants match the seed data from packages/database/prisma/seed.ts
 * Use these for consistent testing against real database data.
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
} as const;

export const TEST_IDS = {
  users: {
    owner: "e2e00000-0000-0000-0000-000000000001",
    admin: "e2e00000-0000-0000-0000-000000000002",
    editor: "e2e00000-0000-0000-0000-000000000003",
    viewer: "e2e00000-0000-0000-0000-000000000004",
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
  },
  domains: {
    verified: "e2e00000-0000-0000-0003-000000000001",
    unverified: "e2e00000-0000-0000-0003-000000000002",
  },
  biopages: {
    main: "e2e00000-0000-0000-0004-000000000001",
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
  },
  organizations: {
    main: "e2e-test-org",
    secondary: "e2e-secondary-org",
  },
  biopages: {
    main: "e2e-profile",
  },
  domains: {
    verified: "e2e-custom.link",
    unverified: "e2e-pending.link",
  },
} as const;

// Expected analytics data (approximate - these are generated randomly)
export const EXPECTED_ANALYTICS = {
  links: {
    popular: {
      estimatedClicks: 500,
      daysSpread: 60,
    },
    marketing: {
      estimatedClicks: 150,
      daysSpread: 30,
    },
    social: {
      estimatedClicks: 80,
      daysSpread: 15,
    },
  },
  countries: ["US", "TH", "JP", "GB", "DE", "FR", "CA", "AU", "BR", "IN"],
  devices: ["Mobile", "Desktop", "Tablet"],
  browsers: ["Chrome", "Safari", "Firefox", "Edge", "Opera"],
  referrers: [
    "google.com",
    "facebook.com",
    "twitter.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
  ],
} as const;

// Password for password-protected link
export const PROTECTED_LINK_PASSWORD = "secret123";
