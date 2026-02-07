import type { Context, Request } from "koa";
import { createController } from "awilix-koa";
import isUuid from "is-uuid";
import { authMiddleware } from "../middleware/auth";
import rateLimit from "koa-ratelimit";
import { createResponse } from "../common/response-builder";
import GeonamesBaseController from "../common/baseController";
import type StateService from "./state.service";

type RequestWithBody = Request & { body?: Record<string, unknown> };
type RequestWithIds = Request & { body?: { ids?: string[] } };

class State extends GeonamesBaseController {
  stateService: InstanceType<typeof StateService>;

  constructor({
    stateService,
  }: {
    stateService: InstanceType<typeof StateService>;
  }) {
    super();
    this.stateService = stateService;
  }

  async cancel(ctx: Context): Promise<void> {
    const response = await this.stateService.cancel(ctx.params.id as string);
    this.assert(ctx, 204, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async create(ctx: Context): Promise<void> {
    const response = await this.stateService.create(
      (ctx.request as RequestWithBody).body ?? {},
    );
    this.assert(ctx, 201, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async get(ctx: Context): Promise<void> {
    const response = await this.stateService.get(
      ctx.params.id as string,
      (ctx.query.deleted ?? "0") === "1",
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async update(ctx: Context): Promise<void> {
    const response = await this.stateService.updateOne(
      ctx.params.id as string,
      (ctx.request as RequestWithBody).body ?? {},
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async list(ctx: Context): Promise<void> {
    const response = await this.stateService.list(
      ctx.query as Record<string, unknown>,
    );
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }

  async bulk(ctx: Context): Promise<void> {
    const { ids } = (ctx.request as RequestWithIds).body ?? {};
    if (!ids || (ids ?? []).filter((item) => isUuid.v4(item)).length === 0) {
      createResponse(
        ctx,
        { message: "Ids must be an array of valid uuids" },
        400,
      );
      return;
    }
    const response = await this.stateService.bulk(ids);
    this.assert(ctx, 200, response);
    createResponse(ctx, response.body, response.statusCode);
  }
}

export default createController(State)
  .before([
    authMiddleware(
      global.appConfig.auth,
      (global.appConfig.authAllowedRoutes as string[] | undefined) ?? [],
    ),
    rateLimit({
      driver: "memory",
      db: new Map(),
      duration: 60 * 1000 * 1000,
      errorMessage: "Sometimes You Just Have to Slow Down.",
      id: (ctx: Context) => ctx.ip,
      headers: {
        remaining: "Rate-Limit-Remaining",
        reset: "Rate-Limit-Reset",
        total: "Rate-Limit-Total",
      },
      max: 100,
      disableHeader: false,
    }),
  ])
  .get("/v1/state", "list")
  .delete("/v1/state/:id", "cancel")
  .post("/v1/state", "create")
  .get("/v1/state/:id", "get")
  .put("/v1/state/:id", "update")
  .post("/v1/state/bulk", "bulk");
