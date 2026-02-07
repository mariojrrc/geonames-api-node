import type { Context, Next } from "koa";

export default async function responseTimeMiddleware(
  ctx: Context,
  next: Next,
): Promise<void> {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set("X-Response-Time", `${ms}ms`);
}
