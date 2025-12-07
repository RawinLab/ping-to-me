import {
  PrismaClient,
  Role,
  MemberRole,
  PlanType,
  LinkStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
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
  tags: {
    marketing: "e2e00000-0000-0000-0005-000000000001",
    social: "e2e00000-0000-0000-0005-000000000002",
    campaign: "e2e00000-0000-0000-0005-000000000003",
  },
  campaigns: {
    summer: "e2e00000-0000-0000-0006-000000000001",
    winter: "e2e00000-0000-0000-0006-000000000002",
  },
  folders: {
    work: "e2e00000-0000-0000-0007-000000000001",
    personal: "e2e00000-0000-0000-0007-000000000002",
  },
};

// Helper function to generate dates in the past
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
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

  // 1. Clean existing test data (optional - uncomment if needed)
  console.log("Cleaning existing E2E test data...");
  await prisma.clickEvent.deleteMany({
    where: {
      link: {
        slug: { startsWith: "e2e-" },
      },
    },
  });
  await prisma.link.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await prisma.folder.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.folders) } },
  });
  await prisma.bioPage.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  await prisma.domain.deleteMany({
    where: { hostname: { startsWith: "e2e-" } },
  });
  await prisma.campaign.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.campaigns) } },
  });
  await prisma.tag.deleteMany({
    where: { id: { in: Object.values(TEST_IDS.tags) } },
  });
  await prisma.apiKey.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });
  await prisma.webhook.deleteMany({
    where: { organization: { slug: { startsWith: "e2e-" } } },
  });
  await prisma.organizationMember.deleteMany({
    where: { organizationId: { in: Object.values(TEST_IDS.organizations) } },
  });
  await prisma.organization.deleteMany({
    where: { slug: { startsWith: "e2e-" } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { endsWith: "@pingtome.test" } } },
  });
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

  // 5. Create domains
  console.log("Creating domains...");
  await Promise.all([
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.verified,
        hostname: "e2e-custom.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: true,
        verificationToken: "verified-token",
      },
    }),
    prisma.domain.create({
      data: {
        id: TEST_IDS.domains.unverified,
        hostname: "e2e-pending.link",
        organizationId: TEST_IDS.organizations.main,
        isVerified: false,
        verificationToken: "pending-verification-token",
      },
    }),
  ]);
  console.log("  Created domains");

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
  ]);
  console.log("  Created tags");

  // 7. Create campaigns
  console.log("Creating campaigns...");
  await Promise.all([
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.summer,
        name: "Summer Sale 2024",
        description: "Summer promotion campaign",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
    prisma.campaign.create({
      data: {
        id: TEST_IDS.campaigns.winter,
        name: "Winter Deals 2024",
        description: "Winter promotion campaign",
        organizationId: TEST_IDS.organizations.main,
      },
    }),
  ]);
  console.log("  Created campaigns");

  // 8. Create folders
  console.log("Creating folders...");
  await Promise.all([
    prisma.folder.create({
      data: {
        id: TEST_IDS.folders.work,
        name: "Work Links",
        color: "#4F46E5",
        userId: TEST_IDS.users.owner,
      },
    }),
    prisma.folder.create({
      data: {
        id: TEST_IDS.folders.personal,
        name: "Personal Links",
        color: "#EC4899",
        userId: TEST_IDS.users.owner,
      },
    }),
  ]);
  console.log("  Created folders");

  // 9. Create bio pages
  console.log("Creating bio pages...");
  await prisma.bioPage.create({
    data: {
      id: TEST_IDS.biopages.main,
      slug: "e2e-profile",
      title: "E2E Test Profile",
      description: "A test bio page for E2E testing",
      organizationId: TEST_IDS.organizations.main,
      theme: {
        backgroundColor: "#1f2937",
        textColor: "#ffffff",
        buttonColor: "#3b82f6",
      },
      content: {
        links: [
          { title: "Website", url: "https://example.com" },
          { title: "Twitter", url: "https://twitter.com/example" },
        ],
      },
    },
  });
  console.log("  Created bio pages");

  // 10. Create links with various statuses
  console.log("Creating links...");
  const links = await Promise.all([
    // Popular link with many clicks
    prisma.link.create({
      data: {
        id: TEST_IDS.links.popular,
        originalUrl: "https://example.com/popular-page",
        slug: "e2e-popular",
        title: "Popular Link",
        description: "A very popular link for testing",
        tags: ["marketing", "popular"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        campaignId: TEST_IDS.campaigns.summer,
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(60),
      },
    }),
    // Marketing link
    prisma.link.create({
      data: {
        id: TEST_IDS.links.marketing,
        originalUrl: "https://example.com/marketing-campaign?utm_source=e2e",
        slug: "e2e-marketing",
        title: "Marketing Campaign Link",
        tags: ["marketing", "campaign"],
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        campaignId: TEST_IDS.campaigns.summer,
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
        userId: TEST_IDS.users.owner,
        organizationId: TEST_IDS.organizations.main,
        passwordHash: await bcrypt.hash("secret123", HASH_ROUNDS),
        status: LinkStatus.ACTIVE,
        createdAt: daysAgo(20),
      },
    }),
    // Recent links (for dashboard testing)
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.link.create({
        data: {
          id: Object.values(TEST_IDS.links)[5 + i],
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
  console.log(`  Created ${links.length} links`);

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

  // 12. Create notifications
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
  ]);
  console.log("  Created notifications");

  // 13. Create API keys
  console.log("Creating API keys...");
  await prisma.apiKey.create({
    data: {
      keyHash: await bcrypt.hash("e2e-test-api-key-12345", HASH_ROUNDS),
      name: "E2E Test API Key",
      organizationId: TEST_IDS.organizations.main,
      lastUsedAt: daysAgo(1),
    },
  });
  console.log("  Created API keys");

  // 14. Create webhooks
  console.log("Creating webhooks...");
  await prisma.webhook.create({
    data: {
      url: "https://webhook.e2e.test/events",
      events: ["link.created", "link.clicked"],
      secret: "e2e-webhook-secret",
      organizationId: TEST_IDS.organizations.main,
      isActive: true,
    },
  });
  console.log("  Created webhooks");

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
  console.log("\nTest Organization: e2e-test-org");
  console.log(`\nTotal Click Events: ${clickData.length}`);
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
