import type { Context, Next } from "koa";

export default async function versionMiddleware(
  ctx: Context,
  next: Next,
): Promise<void> {
  await next();
  ctx.set("X-Api-Version", process.env.npm_package_version ?? "");
}
