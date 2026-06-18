import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { EventConsumer, MESSAGING_CONSUMER_OPTIONS } from "@repo/messaging";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

describe("Orders service (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EventConsumer)
      .useValue({ subscribe: jest.fn() })
      .overrideProvider(MESSAGING_CONSUMER_OPTIONS)
      .useValue({ serviceName: "orders-service", bindings: [] })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("/health (GET)", () => {
    return request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          service: "orders-service",
          exposure: "events-only",
        });
      });
  });
});
