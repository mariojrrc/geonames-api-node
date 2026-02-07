/* eslint-disable global-require */

const DEFAULT_TRANSACTION_NAME = (method: string, path: string): string =>
  `Koajs/${path.startsWith("/") ? path.slice(1) : path}#${method}`;

/**
 * New Relic middleware: sets transaction name and reports errors.
 * Requires the newrelic module to be loaded (e.g. at app entry).
 */
export async function newRelicMiddleware(
  ctx: import("koa").Context,
  next: () => Promise<unknown>,
): Promise<void> {
  const newrelic = require("newrelic") as {
    setTransactionName: (name: string) => void;
    noticeError: (err: Error & { errors?: unknown; status?: number }) => void;
  };

  try {
    await next();
    if (
      typeof (ctx as unknown as { _matchedRoute?: string })._matchedRoute !==
      "undefined"
    ) {
      const route = (ctx as unknown as { _matchedRoute: string })._matchedRoute;
      newrelic.setTransactionName(DEFAULT_TRANSACTION_NAME(ctx.method, route));
    }
  } catch (err) {
    const error = err as Error & { errors?: unknown; status?: number };
    if (typeof error.errors === "object") {
      error.status = 422;
    }
    newrelic.noticeError(error);
    if (
      typeof (ctx as unknown as { _matchedRoute?: string })._matchedRoute !==
      "undefined"
    ) {
      const route = (ctx as unknown as { _matchedRoute: string })._matchedRoute;
      newrelic.setTransactionName(DEFAULT_TRANSACTION_NAME(ctx.method, route));
    }
    throw err;
  }
}
