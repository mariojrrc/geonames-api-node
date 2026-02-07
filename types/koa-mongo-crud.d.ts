declare module "koa-mongo-crud" {
  import type { Context } from "koa";

  export class ValidationException extends Error {
    errors?: unknown;
    constructor(messageOrErrors?: string | unknown);
  }

  export class DuplicationException extends Error {
    errors: unknown;
  }

  export const Uuid: { v4c: () => string };
  interface CrudMapperInstance {
    collection: import("mongodb").Collection;
    collectionName: string;
    pageSize: number;
    queryFilter: { parse: (params: unknown) => unknown };
    detail(id: string, withDeleted?: boolean): Promise<unknown>;
    list(params: unknown, aggregateParam?: unknown): Promise<unknown>;
    update(id: string, post: unknown, withDeleted?: boolean): Promise<unknown>;
    delete(id: string): Promise<unknown>;
    toDatabase(post: unknown): unknown;
    validateAll(post: unknown): unknown;
    validate(post: unknown): unknown;
    checkUniqueness(data: unknown, id?: string): Promise<void>;
    toJson(data: unknown): unknown;
    sanitize(data: unknown, key?: string): unknown;
  }
  interface CrudMapperConstructor {
    new (db: unknown, model: unknown, options?: unknown): CrudMapperInstance;
    generateUuid(): string;
  }
  export const CrudMapper: CrudMapperConstructor;

  export function AuthMiddleware(
    auth: Array<{ identity: string; credential: string }>,
    allowedRoutes?: string[],
  ): import("koa").Middleware;

  export const NewRelicMiddleware: import("koa").Middleware;
}
