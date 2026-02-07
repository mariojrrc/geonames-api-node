declare module "hal" {
  export class Resource {
    constructor(data: Record<string, unknown>);

    embed(name: string, resources: unknown[], full?: boolean): void;
  }
  const hal: { Resource: typeof Resource };
  export default hal;
}
declare module "koa-ratelimit";
declare module "lodash.has";
declare module "is-uuid";
declare module "lodash";
declare module "validator";
