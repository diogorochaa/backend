import { All, Controller, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { ProxyService } from "./proxy.service";

@Controller("users")
export class UsersProxyController {
  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  @All()
  @All("*path")
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const target = this.config.getOrThrow<string>("USERS_SERVICE_URL");
    await this.proxy.forward(target, "/api", req, res);
  }
}
