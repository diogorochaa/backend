import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { firstValueFrom } from "rxjs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "host",
  "content-length",
]);

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Encaminha a requisição para o microserviço interno.
   * @param targetBase URL base do MS (ex: http://localhost:3000)
   * @param apiPrefix prefixo removido do path (ex: /api)
   */
  async forward(
    targetBase: string,
    apiPrefix: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const path =
      req.originalUrl.replace(new RegExp(`^${apiPrefix}`), "") || "/";
    const url = `${targetBase.replace(/\/$/, "")}${path}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
      if (typeof value === "string") headers[key] = value;
    }

    try {
      const upstream = await firstValueFrom(
        this.http.request({
          method: req.method,
          url,
          headers,
          data: ["GET", "HEAD", "DELETE"].includes(req.method)
            ? undefined
            : req.body,
          validateStatus: () => true,
          responseType: "arraybuffer",
        }),
      );

      res.status(upstream.status);
      for (const [key, value] of Object.entries(upstream.headers)) {
        if (value === undefined || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
          continue;
        }
        res.setHeader(key, value as string | number | string[]);
      }
      res.send(upstream.data);
    } catch (error) {
      this.logger.error(`Proxy falhou: ${req.method} ${url}`, error);
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ECONNREFUSED"
      ) {
        throw new ServiceUnavailableException(
          "Microserviço indisponível. Verifique se o serviço interno está rodando.",
        );
      }
      throw new BadGatewayException("Erro ao comunicar com o microserviço");
    }
  }
}
