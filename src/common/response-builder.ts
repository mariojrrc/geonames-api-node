import type { Context } from "koa";

export function createResponse(
  ctx: Context,
  body: unknown,
  status = 200,
): void {
  ctx.body = body;
  ctx.status = status;
}

export default { createResponse };
