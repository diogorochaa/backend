import { Controller, Get } from "@nestjs/common";

/** Health interno — não exposto no API Gateway (serviço só eventos). */
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      service: "orders-service",
      exposure: "events-only",
      status: "ok",
    };
  }
}
