import { omit } from "lodash";
import {
  ValidationException,
  DuplicationException,
  Uuid,
} from "koa-mongo-crud";
import type { Context } from "koa";
import { ApiError } from "./api-error";

export interface BaseServiceOpts {
  context: Context;
  logger?: { info: (msg: string) => void; error: (err: unknown) => void };
}

export default class GeonamesBaseService {
  response: Context["response"];

  context: Context;

  scope: Context["state"]["container"];

  logger: BaseServiceOpts["logger"];

  uuid: () => string;

  constructor(opts: BaseServiceOpts) {
    this.response = opts.context.response;
    this.context = opts.context;
    this.scope = opts.context.state.container;
    this.logger = opts.logger;
    this.uuid = Uuid.v4c;
  }

  sanitize(
    response: { body?: unknown; statusCode?: number; headers?: unknown },
    omitting?: string | string[] | null,
  ): { body?: unknown; statusCode?: number } {
    let propertiesToOmit: string[] = ["headers"];
    if (omitting != null) {
      if (typeof omitting === "string") {
        propertiesToOmit.push(omitting);
      } else {
        propertiesToOmit = propertiesToOmit.concat(omitting);
      }
    }
    return omit(response, propertiesToOmit) as {
      body?: unknown;
      statusCode?: number;
    };
  }

  sanitizedResponse(
    code: number,
    response: unknown,
    omitting?: string | string[],
  ): { body: unknown; statusCode: number } {
    return this.sanitize({ body: response, statusCode: code }, omitting) as {
      body: unknown;
      statusCode: number;
    };
  }

  responseError(error: unknown): never {
    if (error instanceof ApiError) {
      return this.context.throw(error.status, error.description) as never;
    }
    if (error instanceof ValidationException) {
      return this.context.throw(422, "Unprocessable Entity", {
        message: (error as ValidationException & { errors: unknown }).errors,
      }) as never;
    }
    if (error instanceof DuplicationException) {
      return this.context.throw(409, "Entity conflict", {
        message: (error as DuplicationException & { errors: unknown }).errors,
      }) as never;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    return this.context.throw(500, err.message) as never;
  }
}
