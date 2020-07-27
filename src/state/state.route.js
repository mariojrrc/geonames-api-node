const { createController } = require("awilix-koa");
const { AuthMiddleware } = require("koa-mongo-crud");
const isUuid = require("is-uuid");
const responseBuilder = require("../common/response-builder");
const GeonamesBaseController = require("../common/baseController");

class State extends GeonamesBaseController {
  constructor({ stateService }) {
    super();
    this.stateService = stateService;
  }

  async cancel(ctx) {
    const response = await this.stateService.cancel(ctx.params.id);
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async create(ctx) {
    const response = await this.stateService.create(ctx.request.body);
    this.assert(ctx, 201, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async get(ctx) {
    const response = await this.stateService.get(
      ctx.params.id,
      (ctx.query.deleted || "0") === "1"
    );
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async update(ctx) {
    const response = await this.stateService.updateOne(
      ctx.params.id,
      ctx.request.body
    );
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async list(ctx) {
    const response = await this.stateService.list(ctx.query);
    this.assert(ctx, 200, response);
    responseBuilder.createResponse(ctx, response.body, response.statusCode);
  }

  async bulk(ctx) {
    const { ids } = ctx.request.body;
    if (!ids || (ids || []).filter((item) => isUuid.v4(item)).length === 0) {
      return responseBuilder.createResponse(
        ctx,
        { message: "Ids must be an array of valid uuids" },
        400
      );
    }
    const response = await this.stateService.bulk(ids);
    this.assert(ctx, 200, response);
    return responseBuilder.createResponse(
      ctx,
      response.body,
      response.statusCode
    );
  }
}

module.exports = createController(State)
  .before(
    AuthMiddleware(
      global.appConfig.auth,
      global.appConfig.authAllowedRoutes || []
    )
  )
  .get("/v1/state", "list")
  .delete("/v1/state/:id", "cancel")
  .post("/v1/state", "create")
  .get("/v1/state/:id", "get")
  .put("/v1/state/:id", "update")
  .post("/v1/state/bulk", "bulk");
