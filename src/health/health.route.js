const { createController } = require("awilix-koa");
const responseBuilder = require("../common/response-builder");
const GeonamesBaseController = require("../common/baseController");

class Health extends GeonamesBaseController {
  get(ctx) {
    const versionNumber = process.env.npm_package_version;
    responseBuilder.createResponse(
      ctx,
      { version: versionNumber, from: ctx.request.ip },
      200
    );
  }
}

module.exports = createController(Health).prefix("/health").get("/", "get");
