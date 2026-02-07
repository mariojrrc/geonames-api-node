import { createController } from "awilix-koa";
import { AuthMiddleware } from "koa-mongo-crud";
import rateLimit from "koa-ratelimit";
import { createResponse } from "../common/response-builder";
import GeonamesBaseController from "../common/baseController";
import type CityService from "./city.service";

class City extends GeonamesBaseController {
  cityService: InstanceType<typeof CityService>;

  constructor({
    cityService,
  }: {
    cityService: InstanceType<typeof CityService>;
  }) {
    super();
    this.cityService = cityService;
  }

  async cancel(ctx: import("koa").Context): Promise<void> {
    const response = await this.cityService.cancel(ctx.params.id as string);
    this.assert(ctx, 204, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async create(ctx: import("koa").Context): Promise<void> {
    const response = await this.cityService.create(
      (
        ctx.request as import("koa").Request & {
          body?: Record<string, unknown>;
        }
      ).body ?? {},
    );
    this.assert(ctx, 201, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async get(ctx: import("koa").Context): Promise<void> {
    const response = await this.cityService.get(
      ctx.params.id as string,
      (ctx.query.deleted ?? "0") === "1",
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async update(ctx: import("koa").Context): Promise<void> {
    const response = await this.cityService.updateOne(
      ctx.params.id as string,
      (
        ctx.request as import("koa").Request & {
          body?: Record<string, unknown>;
        }
      ).body ?? {},
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async list(ctx: import("koa").Context): Promise<void> {
    const response = await this.cityService.list(
      ctx.query as Record<string, unknown>,
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }
}

export default createController(City)
  .before([
    AuthMiddleware(
      global.appConfig.auth,
      (global.appConfig.authAllowedRoutes as string[] | undefined) ?? [],
    ),
    rateLimit({
      driver: "memory",
      db: new Map(),
      duration: 60 * 1000 * 1000,
      errorMessage: "Sometimes You Just Have to Slow Down.",
      id: (ctx: import("koa").Context) => ctx.ip,
      headers: {
        remaining: "Rate-Limit-Remaining",
        reset: "Rate-Limit-Reset",
        total: "Rate-Limit-Total",
      },
      max: 100,
      disableHeader: false,
    }),
  ])
  .get("/v1/city", "list")
  .delete("/v1/city/:id", "cancel")
  .post("/v1/city", "create")
  .get("/v1/city/:id", "get")
  .put("/v1/city/:id", "update");
