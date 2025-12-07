import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import cookieParser from "cookie-parser";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test-e2e" } },
    });
    await app.close();
  });

  const testUser = {
    email: `test-e2e-${Date.now()}@example.com`,
    password: "Password123!",
    name: "Test User",
  };

  let accessToken: string;
  let refreshTokenCookie: string;

  it("/auth/register (POST)", () => {
    return request(app.getHttpServer())
      .post("/auth/register")
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe(testUser.email);
      });
  });

  it("/auth/login (POST)", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        accessToken = res.body.accessToken;

        const cookies = res.headers["set-cookie"];
        expect(cookies).toBeDefined();
        refreshTokenCookie = cookies.find((cookie: string) =>
          cookie.startsWith("refresh_token"),
        );
        expect(refreshTokenCookie).toBeDefined();
      });
  });

  it("/auth/me (GET)", () => {
    return request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
      });
  });

  it("/auth/refresh (POST)", async () => {
    // Wait for 1 second to ensure iat changes
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", [refreshTokenCookie])
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.accessToken).not.toBe(accessToken); // Should be a new token
        accessToken = res.body.accessToken; // Update for subsequent tests if needed
      });
  });

  it("/auth/logout (POST)", () => {
    return request(app.getHttpServer())
      .post("/auth/logout")
      .set("Cookie", [refreshTokenCookie])
      .expect(201)
      .expect((res) => {
        const cookies = res.headers["set-cookie"];
        const logoutCookie = cookies.find((cookie: string) =>
          cookie.includes("refresh_token=;"),
        );
        expect(logoutCookie).toBeDefined();
      });
  });
});
