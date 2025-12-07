import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";

describe("LinksController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const mockUser = {
    userId: "user-123",
    email: "test@example.com",
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/links (POST)", () => {
    it("should create a new link", async () => {
      const dto = {
        originalUrl: "https://example.com/e2e",
        slug: "e2e-test-link",
      };

      // Clean up if exists
      try {
        await prisma.link.delete({ where: { slug: dto.slug } });
      } catch (e) {}

      return request(app.getHttpServer())
        .post("/links")
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.slug).toBe(dto.slug);
          expect(res.body.originalUrl).toBe(dto.originalUrl);
        });
    });

    it("should return 400 for invalid URL", async () => {
      return request(app.getHttpServer())
        .post("/links")
        .send({ originalUrl: "invalid" })
        .expect(400);
    });
  });

  describe("/links (GET)", () => {
    it("should return a list of links", async () => {
      return request(app.getHttpServer())
        .get("/links")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toBeDefined();
        });
    });
  });
});
