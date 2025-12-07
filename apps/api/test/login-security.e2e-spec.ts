import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Login Security (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testUserEmail: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    testUserEmail = `test-login-security-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.loginAttempt.deleteMany({
      where: { email: testUserEmail },
    });

    await prisma.organizationMember.deleteMany({
      where: { user: { email: testUserEmail } },
    });

    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });

    await app.close();
  });

  describe("Login Attempt Logging", () => {
    it("should log failed login attempts", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUserEmail,
          password: "wrongpassword",
        })
        .expect(401);

      // Verify login attempt was logged
      const loginAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: testUserEmail,
          success: false,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(loginAttempt).toBeDefined();
      expect(loginAttempt.email).toBe(testUserEmail);
      expect(loginAttempt.success).toBe(false);
      expect(loginAttempt.reason).toBe("user_not_found");
      expect(loginAttempt.ipAddress).toBeDefined();
      expect(loginAttempt.userAgent).toBeDefined();
    });

    it("should log successful login attempts", async () => {
      // First, create a test user
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: testUserEmail,
          password: "TestPassword123!",
          name: "Login Security Test User",
        })
        .expect(201);

      // Now login successfully
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUserEmail,
          password: "TestPassword123!",
        })
        .expect(200);

      accessToken = response.body.accessToken;

      // Verify successful login was logged
      const loginAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: testUserEmail,
          success: true,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(loginAttempt).toBeDefined();
      expect(loginAttempt.email).toBe(testUserEmail);
      expect(loginAttempt.success).toBe(true);
      expect(loginAttempt.reason).toBeNull();
    });
  });

  describe("Account Lockout", () => {
    const lockoutTestEmail = `lockout-test-${Date.now()}@example.com`;

    afterAll(async () => {
      await prisma.loginAttempt.deleteMany({
        where: { email: lockoutTestEmail },
      });
    });

    it("should lock account after max failed attempts", async () => {
      // Create 5 failed login attempts (default threshold)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post("/auth/login")
          .send({
            email: lockoutTestEmail,
            password: "wrongpassword",
          })
          .expect(401);
      }

      // The 6th attempt should be rejected with account locked message
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: lockoutTestEmail,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.message).toContain("Account is locked");
      expect(response.body.message).toContain("minute");

      // Verify lockout attempt was logged
      const lockoutAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: lockoutTestEmail,
          reason: "account_locked",
        },
        orderBy: { createdAt: "desc" },
      });

      expect(lockoutAttempt).toBeDefined();
    });
  });

  describe("GET /auth/login-activity", () => {
    it("should return login activity for authenticated user", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/login-activity")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("attempts");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("totalPages");
      expect(Array.isArray(response.body.attempts)).toBe(true);

      // Should have at least one attempt (the successful login we made)
      expect(response.body.attempts.length).toBeGreaterThan(0);
      expect(response.body.attempts[0]).toHaveProperty("id");
      expect(response.body.attempts[0]).toHaveProperty("email");
      expect(response.body.attempts[0]).toHaveProperty("success");
      expect(response.body.attempts[0]).toHaveProperty("createdAt");
    });

    it("should support pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/login-activity?page=1&limit=5")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.attempts.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /auth/login-activity/failed", () => {
    it("should return only failed login attempts", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/login-activity/failed")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("attempts");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.attempts)).toBe(true);

      // All attempts should have success: false
      response.body.attempts.forEach((attempt) => {
        expect(attempt.success).toBe(false);
        expect(attempt.reason).toBeDefined();
      });
    });
  });
});
