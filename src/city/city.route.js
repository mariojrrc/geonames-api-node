const { createController } = require("awilix-koa");
const { AuthMiddleware } = require("koa-mongo-crud");
const rateLimit = require("koa-ratelimit");
const responseBuilder = require("../common/response-builder");
const GeonamesBaseController = require("../common/baseController");

class city extends GeonamesBaseController {
  constructor({ cityService }) {
    super();
    this.cityService = cityService;
  }

  async cancel(ctx) {
    const response = await this.cityService.cancel(ctx.params.id);
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async create(ctx) {
    const response = await this.cityService.create(ctx.request.body);
    this.assert(ctx, 201, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async get(ctx) {
    const response = await this.cityService.get(
      ctx.params.id,
      (ctx.query.deleted || "0") === "1"
    );
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async update(ctx) {
    const response = await this.cityService.updateOne(
      ctx.params.id,
      ctx.request.body
    );
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async list(ctx) {
    const response = await this.cityService.list(ctx.query);
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }
}

module.exports = createController(city)
  .before([
    AuthMiddleware(
      global.appConfig.auth,
      global.appConfig.authAllowedRoutes || []
    ),
    rateLimit({
      driver: "memory",
      db: new Map(),
      duration: 60 * 1000 * 1000, // 1 min
      errorMessage: "Sometimes You Just Have to Slow Down.",
      id: (ctx) => ctx.ip,
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
