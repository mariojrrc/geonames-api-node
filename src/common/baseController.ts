import type { Context } from "koa";

export interface ResponseLike {
  statusCode: number;
  body: unknown;
}

export default class GeonamesBaseController {
  assert(
    ctx: Context,
    assertStatusCode: number | number[],
    response: ResponseLike,
  ): void {
    const allowedStatus: number[] = Array.isArray(assertStatusCode)
      ? assertStatusCode.flat()
      : [assertStatusCode];
    if (allowedStatus.indexOf(response.statusCode) === -1) {
      const msg =
        typeof response.body === "object" &&
        response.body !== null &&
        "detail" in response.body
          ? String((response.body as { detail?: string }).detail)
          : String(response.body ?? "");
      ctx.throw(response.statusCode, msg);
    }
  }
}
