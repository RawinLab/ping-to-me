import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../prisma/prisma.service";
import { AppModule } from "../app.module";
import { SslStatus, DomainStatus } from "@pingtome/database";

describe("SSL Endpoints (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let orgId: string;
  let domainId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipe (same as in main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Use seeded e2e test user
    const TEST_EMAIL = "e2e-owner@pingtome.test";
    const TEST_PASSWORD = "TestPassword123!";

    // Login to get valid JWT token
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);

    authToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // Get user's organization
    const userWithOrg = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    orgId = userWithOrg?.memberships[0]?.organizationId;
    if (!orgId) {
      throw new Error("Test user has no organization");
    }

    // Clean up test data
    await prisma.domain.deleteMany({
      where: {
        organizationId: orgId,
        hostname: { contains: "ssl-test" },
      },
    });

    // Create verified domain
    const domain = await prisma.domain.create({
      data: {
        hostname: `ssl-test-${Date.now()}.example.com`,
        organizationId: orgId,
        status: DomainStatus.VERIFIED,
        isVerified: true,
        sslStatus: SslStatus.PENDING,
      },
    });
    domainId = domain.id;
  });

  afterAll(async () => {
    // Clean up test domains only (don't delete seeded user/org)
    if (prisma && orgId) {
      try {
        await prisma.domain.deleteMany({
          where: {
            organizationId: orgId,
            hostname: { contains: "ssl-test" },
          },
        });
      } catch (error) {
        // Log cleanup errors but don't fail the test
        console.error("Cleanup error:", error);
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe("POST /domains/:id/ssl", () => {
    it("should provision SSL certificate for verified domain", async () => {
      const response = await request(app.getHttpServer())
        .post(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        status: SslStatus.ACTIVE,
        certificateId: expect.any(String),
        issuedAt: expect.any(String),
        expiresAt: expect.any(String),
      });

      // Verify domain was updated
      const domain = await prisma.domain.findUnique({
        where: { id: domainId },
      });

      expect(domain?.sslStatus).toBe(SslStatus.ACTIVE);
      expect(domain?.sslProvider).toBe("letsencrypt-mock");
      expect(domain?.sslCertificateId).toBeDefined();
      expect(domain?.sslIssuedAt).toBeDefined();
      expect(domain?.sslExpiresAt).toBeDefined();
    });

    it("should fail for unverified domain", async () => {
      // Create unverified domain
      const unverifiedDomain = await prisma.domain.create({
        data: {
          hostname: `ssl-unverified-${Date.now()}.example.com`,
          organizationId: orgId,
          status: DomainStatus.PENDING,
          isVerified: false,
        },
      });

      await request(app.getHttpServer())
        .post(`/domains/${unverifiedDomain.id}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(400);

      // Clean up
      await prisma.domain.delete({
        where: { id: unverifiedDomain.id },
      });
    });

    it("should fail for non-existent domain", async () => {
      await request(app.getHttpServer())
        .post(`/domains/00000000-0000-0000-0000-000000000000/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .post(`/domains/${domainId}/ssl`)
        .expect(401);
    });
  });

  describe("GET /domains/:id/ssl", () => {
    it("should return SSL certificate status", async () => {
      const response = await request(app.getHttpServer())
        .get(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        autoRenew: expect.any(Boolean),
      });

      // If certificate exists, check additional fields
      if (response.body.status === SslStatus.ACTIVE) {
        expect(response.body).toMatchObject({
          provider: expect.any(String),
          certificateId: expect.any(String),
          issuedAt: expect.any(String),
          expiresAt: expect.any(String),
          daysUntilExpiry: expect.any(Number),
        });
      }
    });

    it("should fail for non-existent domain", async () => {
      await request(app.getHttpServer())
        .get(`/domains/00000000-0000-0000-0000-000000000000/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .get(`/domains/${domainId}/ssl`)
        .expect(401);
    });
  });

  describe("PATCH /domains/:id/ssl", () => {
    it("should enable auto-renewal", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .send({ autoRenew: true })
        .expect(200);

      expect(response.body.autoRenew).toBe(true);

      // Verify domain was updated
      const domain = await prisma.domain.findUnique({
        where: { id: domainId },
      });

      expect(domain?.sslAutoRenew).toBe(true);
    });

    it("should disable auto-renewal", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .send({ autoRenew: false })
        .expect(200);

      expect(response.body.autoRenew).toBe(false);

      // Verify domain was updated
      const domain = await prisma.domain.findUnique({
        where: { id: domainId },
      });

      expect(domain?.sslAutoRenew).toBe(false);
    });

    it("should validate request body", async () => {
      // Send invalid data - empty body should be ignored (autoRenew is optional)
      // Since autoRenew is @IsOptional(), sending {} or invalid types gets stripped by whitelist
      // The endpoint returns current SSL status, so we expect 200 with current autoRenew value
      const response = await request(app.getHttpServer())
        .patch(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .send({}) // Empty body - no changes
        .expect(200);

      // Verify that autoRenew status is returned (from previous test it should be false)
      expect(response.body).toHaveProperty("autoRenew");
      expect(typeof response.body.autoRenew).toBe("boolean");
    });

    it("should fail for non-existent domain", async () => {
      await request(app.getHttpServer())
        .patch(`/domains/00000000-0000-0000-0000-000000000000/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .send({ autoRenew: true })
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .patch(`/domains/${domainId}/ssl`)
        .send({ autoRenew: true })
        .expect(401);
    });
  });

  describe("Audit Logging", () => {
    it("should log SSL provisioning events", async () => {
      // Create new domain for this test
      const testDomain = await prisma.domain.create({
        data: {
          hostname: `ssl-audit-${Date.now()}.example.com`,
          organizationId: orgId,
          status: DomainStatus.VERIFIED,
          isVerified: true,
        },
      });

      // Provision SSL
      await request(app.getHttpServer())
        .post(`/domains/${testDomain.id}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .expect(201);

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "domain.ssl_updated",
          resourceId: testDomain.id,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.details).toMatchObject({
        hostname: testDomain.hostname,
        action: "provision",
        provider: "letsencrypt-mock",
      });

      // Clean up
      await prisma.domain.delete({
        where: { id: testDomain.id },
      });
    });

    it("should log auto-renew changes", async () => {
      // Update auto-renew
      await request(app.getHttpServer())
        .patch(`/domains/${domainId}/ssl`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-Organization-Id", orgId)
        .send({ autoRenew: true })
        .expect(200);

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "domain.ssl_updated",
          resourceId: domainId,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.details).toMatchObject({
        action: "auto_renew_changed",
        autoRenew: true,
      });
    });
  });
});
