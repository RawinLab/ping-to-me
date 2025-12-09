import {
  PrismaClient,
  Role,
  MemberRole,
  PlanType,
  LinkStatus,
  DomainStatus,
  SslStatus,
  CampaignStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

/**
 * E2E Test Data Seed Script
 *
 * This script creates a comprehensive set of test data for E2E testing
 * including users, organizations, links, analytics data, and more.
 *
 * Test User Credentials:
 * - e2e-owner@pingtome.test / TestPassword123!
 * - e2e-admin@pingtome.test / TestPassword123!
 * - e2e-editor@pingtome.test / TestPassword123!
 * - e2e-viewer@pingtome.test / TestPassword123!
 * - e2e-new@pingtome.test / TestPassword123! (for invitation tests)
 */

const TEST_PASSWORD = "TestPassword123!";
const HASH_ROUNDS = 10;

// Fixed UUIDs for consistent test data
const TEST_IDS = {
  users: {
    owner: "e2e00000-0000-0000-0000-000000000001",
    admin: "e2e00000-0000-0000-0000-000000000002",
    editor: "e2e00000-0000-0000-0000-000000000003",
    viewer: "e2e00000-0000-0000-0000-000000000004",
    newUser: "e2e00000-0000-0000-0000-000000000005", // For invitation tests
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
    // Additional links for status tests
    disabled: "e2e00000-0000-0000-0002-000000000011",
    archived: "e2e00000-0000-0000-0002-000000000012",
    banned: "e2e00000-0000-0000-0002-000000000013",
    // Link with UTM params
    utmLink: "e2e00000-0000-0000-0002-000000000014",
    // Link with max clicks
    maxClicks: "e2e00000-0000-0000-0002-000000000015",
    // Link with custom domain
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
};

// Helper function to generate dates in the past
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper function to generate dates in the future
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Helper function to get current year-month string
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Helper function to get previous year-month strings
function getYearMonth(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Generate random invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to generate random click data with realistic distribution
function generateClickEvents(
  linkId: string,
  count: number,
  daysSpread: number = 30,
  options?: {
    trendDirection?: "up" | "down" | "steady"; // Simulate growth or decline
    weekendBoost?: boolean; // More clicks on weekends
    recentBoost?: boolean; // More clicks in recent days
  },
) {
  const countries = [
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
  ];
  const countryWeights = [25, 20, 10, 8, 7, 5, 5, 4, 4, 4, 3, 2, 1, 1, 1]; // More clicks from US and TH
  const cities = {
    US: [
      "New York",
      "Los Angeles",
      "Chicago",
      "San Francisco",
      "Seattle",
      "Miami",
      "Boston",
      "Austin",
    ],
    TH: [
      "Bangkok",
      "Chiang Mai",
      "Phuket",
      "Pattaya",
      "Nonthaburi",
      "Khon Kaen",
    ],
    JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo"],
    GB: [
      "London",
      "Manchester",
      "Birmingham",
      "Liverpool",
      "Edinburgh",
      "Bristol",
    ],
    DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"],
    FR: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Bordeaux"],
    CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
    BR: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza"],
    IN: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata"],
    SG: ["Singapore"],
    KR: ["Seoul", "Busan", "Incheon"],
    NL: ["Amsterdam", "Rotterdam", "The Hague"],
    ES: ["Madrid", "Barcelona", "Valencia", "Seville"],
    IT: ["Rome", "Milan", "Naples", "Turin"],
  };
  const devices = ["Mobile", "Desktop", "Tablet"];
  const deviceWeights = [55, 40, 5]; // More mobile users
  const browsers = [
    "Chrome",
    "Safari",
    "Firefox",
    "Edge",
    "Opera",
    "Samsung Internet",
  ];
  const browserWeights = [60, 20, 8, 7, 3, 2];
  const osList = ["Windows", "macOS", "iOS", "Android", "Linux"];
  const osWeights = [30, 15, 25, 25, 5];
  const referrers = [
    "direct",
    "google.com",
    "facebook.com",
    "twitter.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
    "t.co",
    "reddit.com",
    "tiktok.com",
  ];
  const referrerWeights = [30, 25, 15, 8, 5, 7, 4, 3, 2, 1];

  // Helper for weighted random selection
  function weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // Generate random hour with realistic distribution (more clicks during day)
  function getRandomHour(): number {
    const hourWeights = [
      1, 1, 1, 1, 1, 2, 3, 5, 8, 10, 10, 9, 8, 9, 10, 10, 9, 8, 7, 6, 5, 4, 3,
      2,
    ];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return weightedRandom(hours, hourWeights);
  }

  const events = [];
  for (let i = 0; i < count; i++) {
    // Calculate day with optional trend
    let dayOffset: number;
    if (options?.recentBoost) {
      // More clicks in recent days (exponential distribution)
      dayOffset = Math.floor(Math.pow(Math.random(), 2) * daysSpread);
    } else if (options?.trendDirection === "up") {
      // Growing trend - more clicks recently
      dayOffset = Math.floor(Math.pow(Math.random(), 1.5) * daysSpread);
    } else if (options?.trendDirection === "down") {
      // Declining trend - more clicks in the past
      dayOffset = Math.floor((1 - Math.pow(Math.random(), 1.5)) * daysSpread);
    } else {
      dayOffset = Math.floor(Math.random() * daysSpread);
    }

    // Weekend boost
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    if (options?.weekendBoost && (date.getDay() === 0 || date.getDay() === 6)) {
      // 30% chance to generate another click on same day (effectively boosting weekend)
      if (Math.random() < 0.3) {
        dayOffset = dayOffset; // Keep same day
      }
    }

    const country = weightedRandom(countries, countryWeights);
    const cityList = cities[country as keyof typeof cities] || ["Unknown"];
    const city = cityList[Math.floor(Math.random() * cityList.length)];
    const device = weightedRandom(devices, deviceWeights);
    const browser = weightedRandom(browsers, browserWeights);
    const osChoice = weightedRandom(osList, osWeights);
    const referrer = weightedRandom(referrers, referrerWeights);

    // Generate timestamp with realistic hour distribution
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - dayOffset);
    timestamp.setHours(
      getRandomHour(),
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 60),
    );

    events.push({
      linkId,
      timestamp,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country,
      city,
      device,
      browser,
      os: osChoice,
      referrer: referrer === "direct" ? null : `https://${referrer}`,
      userAgent: `Mozilla/5.0 (${device === "Mobile" ? "iPhone; CPU iPhone OS 17_0 like Mac OS X" : device === "Tablet" ? "iPad; CPU OS 17_0 like Mac OS X" : `${osChoice}; x64`}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}/${Math.floor(100 + Math.random() * 20)}.0.0.0`,
    });
  }
  return events;
}

/**
 * Seed Plan Definitions
 * Creates the three plan tiers: Free, Pro, and Enterprise
 */
async function seedPlanDefinitions() {
  console.log("Seeding plan definitions...");

  const plans = [
    {
      name: "free",
      displayName: "Free",
      linksPerMonth: 50,
      customDomains: 1,
      teamMembers: 1,
      apiCallsPerMonth: 0, // Free plan has no API access
      analyticsRetentionDays: 30,
      priceMonthly: new Decimal(0),
      priceYearly: new Decimal(0),
      features: [
        "50 links per month",
        "1 custom domain",
        "Basic analytics (30 days)",
        "Standard support",
      ],
      isActive: true,
    },
    {
      name: "pro",
      displayName: "Pro",
      linksPerMonth: 1000,
      customDomains: 5,
      teamMembers: 10,
      apiCallsPerMonth: 10000,
      analyticsRetentionDays: 90,
      priceMonthly: new Decimal(9),
      priceYearly: new Decimal(90), // 2 months free
      features: [
        "1,000 links per month",
        "5 custom domains",
        "Up to 10 team members",
        "10,000 API calls per month",
        "Advanced analytics (90 days)",
        "Priority support",
      ],
      isActive: true,
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      linksPerMonth: -1, // Unlimited
      customDomains: -1, // Unlimited
      teamMembers: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      analyticsRetentionDays: 730, // 2 years
      priceMonthly: new Decimal(49),
      priceYearly: new Decimal(490), // 2 months free
      features: [
        "Unlimited links",
        "Unlimited custom domains",
        "Unlimited team members",
        "Unlimited API calls",
        "Analytics retention (2 years)",
        "SSO/SAML support",
        "Dedicated support",
        "SLA guarantee",
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.planDefinition.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  Upserted plan: ${plan.displayName}`);
  }

  console.log("  Plan definitions seeded successfully");
}

async function main() {
  console.log("Starting E2E test data seed...\n");

  // Seed plan definitions first (required for organizations and users)
  await seedPlanDefinitions();
  console.log();

  // Hash password once for all users
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, HASH_ROUNDS);

  // 1. Clean existing test data
  console.log("Cleaning existing E2E test data...");

  // Clean analytics and events first (depends on links)
  await prisma.clickEvent.deleteMany({
    where: {
      link: {
        slug: { startsWith: "e2e-" },
      },
    },
  });
  await prisma.analyticsDaily.deleteMany({
    where: {
      link: {
        slug: { startsWith: "e2e-" },
      },
    },
  });

  // Clean QR codes (depends on links)
  await prisma.qrCode.deleteMany({
    where: {
      link: {
        slug: { startsWith: "e2e-" },
      },
    },
  });

  // Clean bio page analytics and links (depends on bio pages)
  await prisma.bioPageAnalytics.deleteMany({
    where: {
      bioPage: {
        slug: { startsWith: "e2e-" },
      },
    },
  });
  await prisma.bioPageLink.deleteMany({
    where: {
      bioPage: {
        slug: { startsWith: "e2e-" },
      },
    },
  });

  // Clean links
  await prisma.link.deleteMany({ where: { slug: { startsWith: "e2e-" } } });

  // Clean folders (might have hierarchy)
  await prisma.folder.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.folders) } },
  });

  // Clean bio pages
  await prisma.bioPage.deleteMany({ where: { slug: { startsWith: "e2e-" } } });

  // Clean domains
  await prisma.domain.deleteMany({
    where: { hostname: { startsWith: "e2e-" } },
  });

  // Clean campaigns
  await prisma.campaign.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.campaigns) } },
  });

  // Clean tags
  await prisma.tag.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.tags) } },
  });

  // Clean API keys
  await prisma.apiKey.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean webhooks
  await prisma.webhook.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean usage tracking
  await prisma.usageTracking.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean usage events
  await prisma.usageEvent.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean audit logs
  await prisma.auditLog.deleteMany({
    where: { organizationId: { in: Object.values(TEST_IDS.organizations) } },
  });

  // Clean invitations
  await prisma.organizationInvitation.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean organization settings
  await prisma.organizationSettings.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });

  // Clean organization members
  await prisma.organizationMember.deleteMany({
    where: { organizationId: { in: Object.values(TEST_IDS.organizations) } },
  });

  // Clean organizations
  await prisma.organization.deleteMany({
    where: { slug: { startsWith: "e2e-" } },
  });

  // Clean notifications
  await prisma.notification.deleteMany({
    where: { user: { email: { endsWith: "@pingtome.test" } } },
  });

  // Clean login attempts
  await prisma.loginAttempt.deleteMany({
    where: { email: { endsWith: "@pingtome.test" } },
  });

  // Clean users
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@pingtome.test" } },
  });

  // 2. Create test users
  console.log("Creating test users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: TEST_IDS.users.owner,
        email: "e2e-owner@pingtome.test",
        name: "E2E Owner User",
        password: passwordHash,
        role: Role.OWNER,
        emailVerified: new Date(),
        plan: "pro",
        twoFactorEnabled: false,
      },
    }),
    prisma.user.create({
      data: {
        id: TEST_IDS.users.admin,
        email: "e2e-admin@pingtome.test",
        name: "E2E Admin User",
        password: passwordHash,
        role: Role.ADMIN,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: TEST_IDS.users.editor,
        email: "e2e-editor@pingtome.test",
        name: "E2E Editor User",
        password: passwordHash,
        role: Role.MEMBER,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: TEST_IDS.users.viewer,
        email: "e2e-viewer@pingtome.test",
        name: "E2E Viewer User",
        password: passwordHash,
        role: Role.MEMBER,
        emailVerified: new Date(),
      },
    }),
    // New user for invitation tests (not part of any org initially)
    prisma.user.create({
      data: {
        id: TEST_IDS.users.newUser,
        email: "e2e-new@pingtome.test",
        name: "E2E New User",
        password: passwordHash,
        role: Role.MEMBER,
        emailVerified: new Date(),
      },
    }),
  ]);
  console.log(`  Created ${users.length} test users`);

  // 3. Create organizations
  console.log("Creating organizations...");
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        id: TEST_IDS.organizations.main,
        name: "E2E Test Organization",
        slug: "e2e-test-org",
        plan: PlanType.PRO,
      },
    }),
    prisma.organization.create({
      data: {
        id: TEST_IDS.organizations.secondary,
        name: "E2E Secondary Organization",
        slug: "e2e-secondary-org",
        plan: PlanType.FREE,
      },
    }),
  ]);
  console.log(`  Created ${organizations.length} organizations`);

  // 4. Create organization members
  console.log("Creating organization members...");
  await Promise.all([
    prisma.organizationMember.create({
      data: {
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        role: MemberRole.OWNER,
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: TEST_IDS.users.admin,
        organizationId: TEST_IDS.organizations.main,
        role: MemberRole.ADMIN,
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: TEST_IDS.users.editor,
        organizationId: TEST_IDS.organizations.main,
        role: MemberRole.EDITOR,
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: TEST_IDS.users.viewer,
        organizationId: TEST_IDS.organizations.main,
        role: MemberRole.VIEWER,
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.secondary,
        role: MemberRole.OWNER,
      },
    }),
  ]);
  console.log("  Created organization members");

  // 5. Create domains with various statuses
  console.log("Creating domains...");
  await Promise.all([
    // Fully verified domain with SSL
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.verified,
        hostname: "e2e-custom.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: true,
        status: DomainStatus.VERIFIED,
        verificationType: "txt",
        verificationToken: "verified-token",
        lastVerifiedAt: daysAgo(5),
        sslStatus: SslStatus.ACTIVE,
        sslProvider: "letsencrypt",
        sslCertificateId: "cert-12345",
        sslIssuedAt: daysAgo(30),
        sslExpiresAt: daysFromNow(60),
        isDefault: true,
      },
    }),
    // Pending verification domain
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.unverified,
        hostname: "e2e-pending.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: false,
        status: DomainStatus.PENDING,
        verificationType: "cname",
        verificationToken: "pending-verification-token",
        verificationAttempts: 0,
      },
    }),
    // Currently verifying domain
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.verifying,
        hostname: "e2e-verifying.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: false,
        status: DomainStatus.VERIFYING,
        verificationType: "txt",
        verificationToken: "verifying-token",
        verificationAttempts: 2,
        lastCheckAt: daysAgo(1),
      },
    }),
    // Failed verification domain
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.failed,
        hostname: "e2e-failed.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: false,
        status: DomainStatus.FAILED,
        verificationType: "txt",
        verificationToken: "failed-token",
        verificationAttempts: 5,
        verificationError: "DNS record not found after multiple attempts",
        lastCheckAt: daysAgo(1),
      },
    }),
  ]);
  console.log("  Created domains with various statuses");

  // 6. Create tags
  console.log("Creating tags...");
  await Promise.all([
    prisma.tag.create({
      data: {
        id: TEST_IDS.tags.marketing,
        name: "marketing",
        color: "#DC2626",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
    prisma.tag.create({
      data: {
        id: TEST_IDS.tags.social,
        name: "social",
        color: "#2563EB",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
    prisma.tag.create({
      data: {
        id: TEST_IDS.tags.campaign,
        name: "campaign",
        color: "#16A34A",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
    prisma.tag.create({
      data: {
        id: TEST_IDS.tags.important,
        name: "important",
        color: "#F59E0B",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
    prisma.tag.create({
      data: {
        id: TEST_IDS.tags.temporary,
        name: "temporary",
        color: "#8B5CF6",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
  ]);
  console.log("  Created tags");

  // 7. Create campaigns with various statuses
  console.log("Creating campaigns...");
  await Promise.all([
    // Draft campaign
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.summer,
        name: "Summer Sale 2024",
        description: "Summer promotion campaign",
        organizationId: TEST_IDS.organizations.main,
        status: CampaignStatus.DRAFT,
        startDate: daysFromNow(30),
        endDate: daysFromNow(60),
        utmSource: "summer_promo",
        utmMedium: "email",
        utmCampaign: "summer_sale_2024",
      },
    }),
    // Paused campaign
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.winter,
        name: "Winter Deals 2024",
        description: "Winter promotion campaign",
        organizationId: TEST_IDS.organizations.main,
        status: CampaignStatus.PAUSED,
        startDate: daysAgo(30),
        endDate: daysFromNow(30),
        utmSource: "winter_promo",
        utmMedium: "social",
        utmCampaign: "winter_deals_2024",
      },
    }),
    // Active campaign with goals
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.active,
        name: "Active Marketing Campaign",
        description: "Currently running marketing campaign with click goals",
        organizationId: TEST_IDS.organizations.main,
        status: CampaignStatus.ACTIVE,
        startDate: daysAgo(15),
        endDate: daysFromNow(15),
        goalType: "clicks",
        goalTarget: 1000,
        utmSource: "active_campaign",
        utmMedium: "mixed",
        utmCampaign: "active_marketing",
      },
    }),
    // Completed campaign
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.completed,
        name: "Completed Q3 Campaign",
        description: "Successfully completed campaign from Q3",
        organizationId: TEST_IDS.organizations.main,
        status: CampaignStatus.COMPLETED,
        startDate: daysAgo(90),
        endDate: daysAgo(60),
        goalType: "clicks",
        goalTarget: 500,
        utmSource: "q3_campaign",
        utmMedium: "ads",
        utmCampaign: "q3_promotion",
      },
    }),
  ]);
  console.log("  Created campaigns with various statuses");

  // 8. Create folders (with hierarchy)
  console.log("Creating folders...");
  // Create parent folders first
  await prisma.folder.create({
    data: {
      id: TEST_IDS.folders.work,
      name: "Work Links",
      color: "#4F46E5",
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
    },
  });
  await prisma.folder.create({
    data: {
      id: TEST_IDS.folders.personal,
      name: "Personal Links",
      color: "#EC4899",
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
    },
  });
  // Create archived folder
  await prisma.folder.create({
    data: {
      id: TEST_IDS.folders.archived,
      name: "Archived Links",
      color: "#6B7280",
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
      isArchived: true,
      archivedAt: daysAgo(10),
    },
  });
  // Create sub-folder (child of Work Links)
  await prisma.folder.create({
    data: {
      id: TEST_IDS.folders.subFolder,
      name: "Project A",
      color: "#10B981",
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
      parentId: TEST_IDS.folders.work,
    },
  });
  console.log("  Created folders with hierarchy");

  // 9. Create bio pages with BioPageLinks
  console.log("Creating bio pages...");

  // Main bio page
  await prisma.bioPage.create({
    data: {
      id: TEST_IDS.biopages.main,
      slug: "e2e-profile",
      title: "E2E Test Profile",
      description: "A test bio page for E2E testing with multiple links",
      avatarUrl: "https://ui-avatars.com/api/?name=E2E+Test&background=3b82f6&color=fff",
      organizationId: TEST_IDS.organizations.main,
      layout: "stacked",
      theme: {
        backgroundColor: "#1f2937",
        textColor: "#ffffff",
        buttonColor: "#3b82f6",
        buttonTextColor: "#ffffff",
        fontFamily: "Inter",
      },
      socialLinks: [
        { platform: "twitter", url: "https://twitter.com/e2etest" },
        { platform: "instagram", url: "https://instagram.com/e2etest" },
        { platform: "linkedin", url: "https://linkedin.com/in/e2etest" },
        { platform: "github", url: "https://github.com/e2etest" },
      ],
      showBranding: true,
      isPublished: true,
      viewCount: 1250,
    },
  });

  // Secondary bio page (grid layout)
  await prisma.bioPage.create({
    data: {
      id: TEST_IDS.biopages.secondary,
      slug: "e2e-grid-profile",
      title: "E2E Grid Layout Profile",
      description: "A bio page with grid layout",
      organizationId: TEST_IDS.organizations.main,
      layout: "grid",
      theme: {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        buttonColor: "#10B981",
        buttonTextColor: "#ffffff",
      },
      showBranding: false,
      isPublished: true,
      viewCount: 500,
    },
  });

  // Create BioPageLinks for main bio page
  await Promise.all([
    prisma.bioPageLink.create({
      data: {
        id: TEST_IDS.biolinks.link1,
        bioPageId: TEST_IDS.biopages.main,
        title: "My Website",
        description: "Check out my personal website",
        externalUrl: "https://example.com",
        icon: "🌐",
        buttonColor: "#3b82f6",
        textColor: "#ffffff",
        order: 0,
        isVisible: true,
        clickCount: 350,
      },
    }),
    prisma.bioPageLink.create({
      data: {
        id: TEST_IDS.biolinks.link2,
        bioPageId: TEST_IDS.biopages.main,
        title: "Latest Blog Post",
        description: "Read my latest article",
        externalUrl: "https://example.com/blog/latest",
        icon: "📝",
        buttonColor: "#8B5CF6",
        textColor: "#ffffff",
        order: 1,
        isVisible: true,
        clickCount: 220,
      },
    }),
    prisma.bioPageLink.create({
      data: {
        id: TEST_IDS.biolinks.link3,
        bioPageId: TEST_IDS.biopages.main,
        title: "Newsletter Signup",
        description: "Subscribe to my newsletter",
        externalUrl: "https://example.com/newsletter",
        icon: "📧",
        buttonColor: "#F59E0B",
        textColor: "#000000",
        order: 2,
        isVisible: true,
        clickCount: 180,
      },
    }),
    // Hidden link (for testing visibility toggle)
    prisma.bioPageLink.create({
      data: {
        id: TEST_IDS.biolinks.link4,
        bioPageId: TEST_IDS.biopages.main,
        title: "Hidden Link",
        description: "This link is not visible",
        externalUrl: "https://example.com/hidden",
        icon: "🔒",
        order: 3,
        isVisible: false,
        clickCount: 0,
      },
    }),
  ]);

  // Create BioPageAnalytics
  const bioPageAnalytics = [];
  for (let i = 0; i < 100; i++) {
    const daysOffset = Math.floor(Math.random() * 30);
    bioPageAnalytics.push({
      bioPageId: TEST_IDS.biopages.main,
      eventType: Math.random() > 0.3 ? "page_view" : "link_click",
      bioLinkId: Math.random() > 0.5 ? TEST_IDS.biolinks.link1 : null,
      timestamp: daysAgo(daysOffset),
      country: ["US", "TH", "JP", "GB"][Math.floor(Math.random() * 4)],
      city: "Unknown",
      device: ["mobile", "desktop", "tablet"][Math.floor(Math.random() * 3)],
      browser: ["Chrome", "Safari", "Firefox"][Math.floor(Math.random() * 3)],
    });
  }
  await prisma.bioPageAnalytics.createMany({ data: bioPageAnalytics });
  console.log("  Created bio pages with links and analytics");

  // 10. Create links with various statuses and features
  console.log("Creating links...");
  const passwordHashForLink = await bcrypt.hash("secret123", HASH_ROUNDS);
  
  const links = await Promise.all([
    // Popular link with many clicks
    prisma.link.create({
      data: {
        id: TEST_IDS.links.popular,
        originalUrl: "https://example.com/popular-page",
        slug: "e2e-popular",
        title: "Popular Link",
        description: "A very popular link for testing analytics",
        tags: ["marketing", "popular"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        campaignId: TEST_IDS.campaigns.active,
        status: LinkStatus.ACTIVE,
        redirectType: 301,
        safetyStatus: "safe",
        safetyCheckDate: daysAgo(1),
        createdAt: daysAgo(60),
      },
    }),
    // Marketing link with folder
    prisma.link.create({
      data: {
        id: TEST_IDS.links.marketing,
        originalUrl: "https://example.com/marketing-campaign",
        slug: "e2e-marketing",
        title: "Marketing Campaign Link",
        description: "Link for marketing campaign tracking",
        tags: ["marketing", "campaign"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        campaignId: TEST_IDS.campaigns.active,
        folderId: TEST_IDS.folders.work,
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(30),
      },
    }),
    // Social media link
    prisma.link.create({
      data: {
        id: TEST_IDS.links.social,
        originalUrl: "https://example.com/social-share",
        slug: "e2e-social",
        title: "Social Media Link",
        tags: ["social"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(15),
      },
    }),
    // Expired link
    prisma.link.create({
      data: {
        id: TEST_IDS.links.expired,
        originalUrl: "https://example.com/expired-offer",
        slug: "e2e-expired",
        title: "Expired Offer Link",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.EXPIRED,
        expirationDate: daysAgo(5),
        createdAt: daysAgo(45),
      },
    }),
    // Password protected link
    prisma.link.create({
      data: {
        id: TEST_IDS.links.password,
        originalUrl: "https://example.com/protected-content",
        slug: "e2e-protected",
        title: "Password Protected Link",
        description: "Password: secret123",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        passwordHash: passwordHashForLink,
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(20),
      },
    }),
    // Disabled link (for status.spec.ts)
    prisma.link.create({
      data: {
        id: TEST_IDS.links.disabled,
        originalUrl: "https://example.com/disabled-page",
        slug: "e2e-disabled",
        title: "Disabled Link",
        description: "This link has been disabled",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.DISABLED,
        createdAt: daysAgo(40),
      },
    }),
    // Archived link (for status.spec.ts)
    prisma.link.create({
      data: {
        id: TEST_IDS.links.archived,
        originalUrl: "https://example.com/archived-page",
        slug: "e2e-archived",
        title: "Archived Link",
        description: "This link has been archived",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.ARCHIVED,
        deletedAt: daysAgo(10),
        createdAt: daysAgo(50),
      },
    }),
    // Banned link (for status.spec.ts)
    prisma.link.create({
      data: {
        id: TEST_IDS.links.banned,
        originalUrl: "https://example.com/banned-page",
        slug: "e2e-banned",
        title: "Banned Link",
        description: "This link has been banned for policy violation",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.BANNED,
        safetyStatus: "unsafe",
        safetyThreats: ["malware", "phishing"],
        createdAt: daysAgo(35),
      },
    }),
    // Link with UTM parameters
    prisma.link.create({
      data: {
        id: TEST_IDS.links.utmLink,
        originalUrl: "https://example.com/landing-page",
        slug: "e2e-utm-link",
        title: "UTM Tracking Link",
        description: "Link with full UTM parameters",
        tags: ["marketing", "campaign"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        campaignId: TEST_IDS.campaigns.active,
        status: LinkStatus.ACTIVE,
        utmSource: "newsletter",
        utmMedium: "email",
        utmCampaign: "spring_sale",
        utmContent: "hero_button",
        utmTerm: "discount",
        createdAt: daysAgo(10),
      },
    }),
    // Link with max clicks limit
    prisma.link.create({
      data: {
        id: TEST_IDS.links.maxClicks,
        originalUrl: "https://example.com/limited-offer",
        slug: "e2e-max-clicks",
        title: "Limited Click Link",
        description: "This link is limited to 100 clicks",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        status: LinkStatus.ACTIVE,
        maxClicks: 100,
        createdAt: daysAgo(5),
      },
    }),
    // Link with custom domain
    prisma.link.create({
      data: {
        id: TEST_IDS.links.customDomain,
        originalUrl: "https://example.com/custom-domain-page",
        slug: "e2e-custom-domain",
        title: "Custom Domain Link",
        description: "Link using custom domain",
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        domainId: TEST_IDS.domains.verified,
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(8),
      },
    }),
    // Recent links (for dashboard testing)
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.link.create({
        data: {
          id: [TEST_IDS.links.recent1, TEST_IDS.links.recent2, TEST_IDS.links.recent3, TEST_IDS.links.recent4, TEST_IDS.links.recent5][i],
          originalUrl: `https://example.com/recent-${i + 1}`,
          slug: `e2e-recent-${i + 1}`,
          title: `Recent Link ${i + 1}`,
          tags: i % 2 === 0 ? ["marketing"] : ["social"],
          userId: TEST_IDS.users.owner,
          organizationId: TEST_IDS.organizations.main,
          status: LinkStatus.ACTIVE,
          createdAt: daysAgo(i),
        },
      }),
    ),
  ]);
  console.log(`  Created ${links.length} links with various statuses`);

  // 11. Create click events for analytics (90 days of data for comprehensive charts)
  console.log("Creating click events...");
  const clickData = [
    // Popular link: 800+ clicks over 90 days with upward trend
    ...generateClickEvents(TEST_IDS.links.popular, 850, 90, {
      trendDirection: "up",
      weekendBoost: true,
      recentBoost: true,
    }),
    // Marketing link: 300 clicks over 90 days, steady pattern
    ...generateClickEvents(TEST_IDS.links.marketing, 300, 90, {
      trendDirection: "steady",
      weekendBoost: false,
    }),
    // Social link: 200 clicks over 60 days, declining (old campaign)
    ...generateClickEvents(TEST_IDS.links.social, 200, 60, {
      trendDirection: "down",
    }),
    // Expired link: 50 clicks before it expired
    ...generateClickEvents(TEST_IDS.links.expired, 50, 45, {
      trendDirection: "down",
    }),
    // UTM link: clicks for testing UTM tracking
    ...generateClickEvents(TEST_IDS.links.utmLink, 150, 30, {
      trendDirection: "up",
    }),
    // Max clicks link: close to limit
    ...generateClickEvents(TEST_IDS.links.maxClicks, 85, 10, {
      recentBoost: true,
    }),
    // Custom domain link
    ...generateClickEvents(TEST_IDS.links.customDomain, 75, 14, {
      trendDirection: "steady",
    }),
    // Recent links with fresh activity
    ...generateClickEvents(TEST_IDS.links.recent1, 45, 14, {
      recentBoost: true,
    }),
    ...generateClickEvents(TEST_IDS.links.recent2, 30, 10, {
      recentBoost: true,
    }),
    ...generateClickEvents(TEST_IDS.links.recent3, 20, 7, {
      weekendBoost: true,
    }),
    ...generateClickEvents(TEST_IDS.links.recent4, 12, 5),
    ...generateClickEvents(TEST_IDS.links.recent5, 8, 3),
  ];

  // Batch insert click events
  await prisma.clickEvent.createMany({
    data: clickData,
  });
  console.log(`  Created ${clickData.length} click events`);

  // 11.1 Create QR codes for links (for qr.spec.ts)
  console.log("Creating QR codes...");
  await Promise.all([
    prisma.qrCode.create({
      data: {
        id: TEST_IDS.qrcodes.popular,
        linkId: TEST_IDS.links.popular,
        foregroundColor: "#000000",
        backgroundColor: "#FFFFFF",
        size: 300,
        errorCorrection: "M",
        borderSize: 2,
      },
    }),
    prisma.qrCode.create({
      data: {
        id: TEST_IDS.qrcodes.marketing,
        linkId: TEST_IDS.links.marketing,
        foregroundColor: "#DC2626",
        backgroundColor: "#FEF2F2",
        size: 400,
        errorCorrection: "H",
        borderSize: 4,
      },
    }),
    // Customized QR code with logo
    prisma.qrCode.create({
      data: {
        id: TEST_IDS.qrcodes.customized,
        linkId: TEST_IDS.links.utmLink,
        foregroundColor: "#3B82F6",
        backgroundColor: "#EFF6FF",
        logoUrl: "https://example.com/logo.png",
        logoSizePercent: 25,
        size: 500,
        errorCorrection: "H",
        borderSize: 3,
      },
    }),
  ]);
  console.log("  Created QR codes");

  // 11.2 Create AnalyticsDaily aggregates
  console.log("Creating daily analytics aggregates...");
  const analyticsDaily = [];
  const linksForDailyAnalytics = [
    TEST_IDS.links.popular,
    TEST_IDS.links.marketing,
    TEST_IDS.links.social,
  ];
  
  for (const linkId of linksForDailyAnalytics) {
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      
      analyticsDaily.push({
        linkId,
        date,
        totalClicks: Math.floor(10 + Math.random() * 50),
        uniqueVisitors: Math.floor(8 + Math.random() * 40),
        countries: { US: Math.floor(Math.random() * 20), TH: Math.floor(Math.random() * 15), JP: Math.floor(Math.random() * 10) },
        devices: { Desktop: Math.floor(Math.random() * 30), Mobile: Math.floor(Math.random() * 40), Tablet: Math.floor(Math.random() * 10) },
        browsers: { Chrome: Math.floor(Math.random() * 40), Safari: Math.floor(Math.random() * 20), Firefox: Math.floor(Math.random() * 10) },
        os: { Windows: Math.floor(Math.random() * 25), macOS: Math.floor(Math.random() * 20), iOS: Math.floor(Math.random() * 20), Android: Math.floor(Math.random() * 15) },
        referrers: { "google.com": Math.floor(Math.random() * 15), direct: Math.floor(Math.random() * 20), "facebook.com": Math.floor(Math.random() * 10) },
      });
    }
  }
  await prisma.analyticsDaily.createMany({ data: analyticsDaily });
  console.log(`  Created ${analyticsDaily.length} daily analytics records`);

  // 12. Create invitations (for member-invite-remove.spec.ts)
  console.log("Creating organization invitations...");
  const invitationTokenPending = generateInvitationToken();
  const invitationTokenExpired = generateInvitationToken();
  const invitationTokenAccepted = generateInvitationToken();
  
  await Promise.all([
    // Pending invitation
    prisma.organizationInvitation.create({
      data: {
        id: TEST_IDS.invitations.pending,
        organizationId: TEST_IDS.organizations.main,
        email: "pending-invite@pingtome.test",
        role: MemberRole.EDITOR,
        token: invitationTokenPending,
        tokenHash: await bcrypt.hash(invitationTokenPending, HASH_ROUNDS),
        invitedById: TEST_IDS.users.owner,
        personalMessage: "Welcome to our team! Looking forward to working with you.",
        expiresAt: daysFromNow(7),
        createdAt: daysAgo(1),
      },
    }),
    // Expired invitation
    prisma.organizationInvitation.create({
      data: {
        id: TEST_IDS.invitations.expired,
        organizationId: TEST_IDS.organizations.main,
        email: "expired-invite@pingtome.test",
        role: MemberRole.VIEWER,
        token: invitationTokenExpired,
        tokenHash: await bcrypt.hash(invitationTokenExpired, HASH_ROUNDS),
        invitedById: TEST_IDS.users.owner,
        expiresAt: daysAgo(1), // Already expired
        createdAt: daysAgo(8),
      },
    }),
    // Accepted invitation
    prisma.organizationInvitation.create({
      data: {
        id: TEST_IDS.invitations.accepted,
        organizationId: TEST_IDS.organizations.main,
        email: "e2e-admin@pingtome.test",
        role: MemberRole.ADMIN,
        token: invitationTokenAccepted,
        tokenHash: await bcrypt.hash(invitationTokenAccepted, HASH_ROUNDS),
        invitedById: TEST_IDS.users.owner,
        expiresAt: daysFromNow(7),
        acceptedAt: daysAgo(5), // Was accepted
        createdAt: daysAgo(10),
      },
    }),
  ]);
  console.log("  Created organization invitations");

  // 13. Create usage tracking (for quota-plan.spec.ts)
  console.log("Creating usage tracking records...");
  await Promise.all([
    // Current month usage
    prisma.usageTracking.create({
      data: {
        organizationId: TEST_IDS.organizations.main,
        yearMonth: getCurrentYearMonth(),
        linksCreated: 45,
        apiCalls: 1250,
      },
    }),
    // Previous months usage (for trend analysis)
    prisma.usageTracking.create({
      data: {
        organizationId: TEST_IDS.organizations.main,
        yearMonth: getYearMonth(1),
        linksCreated: 38,
        apiCalls: 980,
      },
    }),
    prisma.usageTracking.create({
      data: {
        organizationId: TEST_IDS.organizations.main,
        yearMonth: getYearMonth(2),
        linksCreated: 52,
        apiCalls: 1450,
      },
    }),
    // Secondary org (free plan) usage
    prisma.usageTracking.create({
      data: {
        organizationId: TEST_IDS.organizations.secondary,
        yearMonth: getCurrentYearMonth(),
        linksCreated: 12,
        apiCalls: 0,
      },
    }),
  ]);
  console.log("  Created usage tracking records");

  // 14. Create usage events (for detailed tracking)
  console.log("Creating usage events...");
  const usageEvents = [];
  for (let i = 0; i < 50; i++) {
    usageEvents.push({
      organizationId: TEST_IDS.organizations.main,
      userId: [TEST_IDS.users.owner, TEST_IDS.users.admin, TEST_IDS.users.editor][Math.floor(Math.random() * 3)],
      eventType: ["link_created", "link_deleted", "api_call", "domain_added"][Math.floor(Math.random() * 4)],
      resourceId: TEST_IDS.links.popular,
      metadata: { source: "web" },
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
    });
  }
  await prisma.usageEvent.createMany({ data: usageEvents });
  console.log(`  Created ${usageEvents.length} usage events`);

  // 15. Create audit logs (for security/compliance testing)
  console.log("Creating audit logs...");
  const auditLogs = [
    {
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
      action: "link.created",
      resource: "Link",
      resourceId: TEST_IDS.links.popular,
      status: "success",
      details: { slug: "e2e-popular", title: "Popular Link" },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
      geoLocation: "US, California",
      createdAt: daysAgo(60),
    },
    {
      userId: TEST_IDS.users.admin,
      organizationId: TEST_IDS.organizations.main,
      action: "member.invited",
      resource: "OrganizationMember",
      status: "success",
      details: { email: "pending-invite@pingtome.test", role: "EDITOR" },
      ipAddress: "192.168.1.2",
      createdAt: daysAgo(1),
    },
    {
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
      action: "auth.login",
      resource: "User",
      resourceId: TEST_IDS.users.owner,
      status: "success",
      ipAddress: "192.168.1.1",
      geoLocation: "US, California",
      createdAt: daysAgo(0),
    },
    {
      userId: TEST_IDS.users.viewer,
      organizationId: TEST_IDS.organizations.main,
      action: "link.delete",
      resource: "Link",
      status: "failure",
      details: { reason: "Permission denied" },
      ipAddress: "192.168.1.5",
      createdAt: daysAgo(2),
    },
    {
      userId: TEST_IDS.users.owner,
      organizationId: TEST_IDS.organizations.main,
      action: "settings.updated",
      resource: "Organization",
      resourceId: TEST_IDS.organizations.main,
      status: "success",
      changes: { before: { name: "Old Name" }, after: { name: "E2E Test Organization" } },
      createdAt: daysAgo(15),
    },
  ];
  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`  Created ${auditLogs.length} audit log entries`);

  // 16. Create notifications
  console.log("Creating notifications...");
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.owner,
        type: "INFO",
        title: "Welcome to PingTO.Me!",
        message: "Start creating short links and track their performance.",
        read: true,
        createdAt: daysAgo(30),
      },
    }),
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.owner,
        type: "INFO",
        title: "Your link reached 100 clicks!",
        message: "Congratulations! Your popular link has reached 100 clicks.",
        read: true,
        createdAt: daysAgo(20),
      },
    }),
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.owner,
        type: "WARNING",
        title: "Link expiring soon",
        message: 'Your "Expired Offer Link" will expire in 24 hours.',
        read: false,
        createdAt: daysAgo(6),
      },
    }),
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.owner,
        type: "INFO",
        title: "New team member joined",
        message: "E2E Admin User has joined your organization.",
        read: false,
        createdAt: daysAgo(1),
      },
    }),
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.owner,
        type: "WARNING",
        title: "Approaching usage limit",
        message: "You have used 90% of your monthly link quota.",
        read: false,
        createdAt: daysAgo(0),
      },
    }),
    // Notifications for other users
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.admin,
        type: "INFO",
        title: "You were added to E2E Test Organization",
        message: "You now have Admin access to the organization.",
        read: true,
        createdAt: daysAgo(5),
      },
    }),
    prisma.notification.create({
      data: {
        userId: TEST_IDS.users.editor,
        type: "INFO",
        title: "Link assigned to you",
        message: "A marketing link has been assigned to you for management.",
        read: false,
        createdAt: daysAgo(2),
      },
    }),
  ]);
  console.log("  Created notifications");

  // 17. Create API keys with various configs
  console.log("Creating API keys...");
  await Promise.all([
    prisma.apiKey.create({
      data: {
        id: TEST_IDS.apiKeys.main,
        keyHash: await bcrypt.hash("e2e-test-api-key-12345", HASH_ROUNDS),
        name: "E2E Test API Key",
        organizationId: TEST_IDS.organizations.main,
        scopes: ["link:read", "link:create", "link:update", "link:delete", "analytics:read"],
        rateLimit: 100,
        lastUsedAt: daysAgo(1),
      },
    }),
    // Expired API key
    prisma.apiKey.create({
      data: {
        id: TEST_IDS.apiKeys.expired,
        keyHash: await bcrypt.hash("e2e-expired-api-key-99999", HASH_ROUNDS),
        name: "Expired API Key",
        organizationId: TEST_IDS.organizations.main,
        scopes: ["link:read"],
        expiresAt: daysAgo(10), // Already expired
        lastUsedAt: daysAgo(15),
      },
    }),
  ]);
  console.log("  Created API keys");

  // 18. Create webhooks with various configs
  console.log("Creating webhooks...");
  await Promise.all([
    prisma.webhook.create({
      data: {
        id: TEST_IDS.webhooks.main,
        url: "https://webhook.e2e.test/events",
        events: ["link.created", "link.clicked", "link.deleted", "member.joined"],
        secret: "e2e-webhook-secret-12345",
        organizationId: TEST_IDS.organizations.main,
        isActive: true,
      },
    }),
    // Inactive webhook
    prisma.webhook.create({
      data: {
        id: TEST_IDS.webhooks.inactive,
        url: "https://webhook.e2e.test/old-endpoint",
        events: ["link.created"],
        secret: "e2e-old-webhook-secret",
        organizationId: TEST_IDS.organizations.main,
        isActive: false,
      },
    }),
  ]);
  console.log("  Created webhooks");

  // 19. Create organization settings
  console.log("Creating organization settings...");
  await prisma.organizationSettings.create({
    data: {
      organizationId: TEST_IDS.organizations.main,
      ssoEnabled: false,
      enforced2FA: false,
      enforce2FAForRoles: ["OWNER"],
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 7200,
    },
  });
  console.log("  Created organization settings");

  // 20. Create login attempts (for security testing)
  console.log("Creating login attempts...");
  const loginAttempts = [
    {
      email: "e2e-owner@pingtome.test",
      success: true,
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
      location: "Bangkok, Thailand",
      createdAt: daysAgo(0),
    },
    {
      email: "e2e-owner@pingtome.test",
      success: false,
      ipAddress: "10.0.0.5",
      userAgent: "Mozilla/5.0 Firefox/121.0",
      location: "Unknown",
      reason: "invalid_password",
      createdAt: daysAgo(1),
    },
    {
      email: "e2e-admin@pingtome.test",
      success: true,
      ipAddress: "192.168.1.2",
      userAgent: "Mozilla/5.0 Safari/17.0",
      location: "Tokyo, Japan",
      createdAt: daysAgo(2),
    },
    {
      email: "unknown@test.com",
      success: false,
      ipAddress: "suspicious.ip.1.1",
      reason: "user_not_found",
      createdAt: daysAgo(3),
    },
  ];
  await prisma.loginAttempt.createMany({ data: loginAttempts });
  console.log(`  Created ${loginAttempts.length} login attempt records`);

  // Summary
  console.log("\n========================================");
  console.log("E2E Test Data Seed Complete!");
  console.log("========================================\n");
  console.log("Test User Credentials:");
  console.log("  Email: e2e-owner@pingtome.test");
  console.log("  Password: TestPassword123!");
  console.log("\nOther test users:");
  console.log("  e2e-admin@pingtome.test");
  console.log("  e2e-editor@pingtome.test");
  console.log("  e2e-viewer@pingtome.test");
  console.log("  e2e-new@pingtome.test (for invitation tests)");
  console.log("\nTest Organization: e2e-test-org");
  console.log("\nData Summary:");
  console.log(`  - Links: ${links.length} (with various statuses)`);
  console.log(`  - Click Events: ${clickData.length}`);
  console.log(`  - Daily Analytics: ${analyticsDaily.length}`);
  console.log(`  - Usage Events: ${usageEvents.length}`);
  console.log(`  - Audit Logs: ${auditLogs.length}`);
  console.log(`  - Domains: 4 (verified, pending, verifying, failed)`);
  console.log(`  - Bio Pages: 2 with links and analytics`);
  console.log(`  - QR Codes: 3`);
  console.log(`  - Tags: 5`);
  console.log(`  - Campaigns: 4 (various statuses)`);
  console.log(`  - Invitations: 3 (pending, expired, accepted)`);
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
