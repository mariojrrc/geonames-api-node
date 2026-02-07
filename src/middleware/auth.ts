import type { Context, Next } from "koa";

export interface AuthCredential {
  identity: string;
  credential: string;
}

/**
 * Basic auth middleware. Allows request if config is empty or path is in allowedRoutes.
 */
export function authMiddleware(
  config: AuthCredential[],
  allowedRoutes: string[] = [],
): (ctx: Context, next: Next) => Promise<void> {
  return async (ctx: Context, next: Next): Promise<void> => {
    if (config.length === 0 || allowedRoutes.includes(ctx.request.path)) {
      return next();
    }

    const authHeader = ctx.request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      ctx.throw(401, "Authorization failed");
      return undefined;
    }

    const base64 = authHeader.slice(6);
    let decoded: string;
    try {
      decoded = Buffer.from(base64, "base64").toString("utf8");
    } catch {
      ctx.throw(401, "Authorization failed");
      return undefined;
    }

    const colon = decoded.indexOf(":");
    const name = colon === -1 ? decoded : decoded.slice(0, colon);
    const pass = colon === -1 ? "" : decoded.slice(colon + 1);

    const authenticated = config.some(
      (c) => c.identity === name && c.credential === pass,
    );
    if (!authenticated) {
      ctx.throw(401, "Authorization failed");
      return undefined;
    }

    return next();
  };
}
