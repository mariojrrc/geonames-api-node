import "koa";

declare module "koa" {
  interface DefaultState {
    container?: import("awilix").AwilixContainer;
  }
}
