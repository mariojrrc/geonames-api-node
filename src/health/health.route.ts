import { createController } from "awilix-koa";
import { createResponse } from "../common/response-builder";
import GeonamesBaseController from "../common/baseController";

class Health extends GeonamesBaseController {
  get(ctx: import("koa").Context): void {
    const versionNumber = process.env.npm_package_version;
    createResponse(ctx, { version: versionNumber, from: ctx.request.ip }, 200);
  }
}

export default createController(Health).prefix("/health").get("/", "get");
