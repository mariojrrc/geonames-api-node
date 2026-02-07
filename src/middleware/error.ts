import type { Context, Next } from "koa";
import Status from "http-status";

interface ErrWithStatus extends Error {
  status?: number;
  errors?: unknown;
  stack?: string;
}

export default async function errorMiddleware(
  ctx: Context,
  next: Next,
): Promise<void> {
  try {
    await next();
  } catch (err) {
    const e = err as ErrWithStatus;
    if (typeof e.errors === "object") {
      e.status = 422;
    }
    ctx.status = e.status ?? 500;
    const detail =
      process.env.NODE_ENV === "production"
        ? e.message || e.errors
        : `${e.message || e.errors}\nStacktrace:\n${e.stack ?? ""}`;
    ctx.body = {
      type: `https://httpstatuses.com/${ctx.status}`,
      title: (Status as unknown as Record<number, string>)[ctx.status],
      status: ctx.status,
      detail,
    };
  }
}
