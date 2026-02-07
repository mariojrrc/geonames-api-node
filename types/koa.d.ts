import type { AwilixContainer } from "awilix";
import "koa";

declare module "koa" {
  interface DefaultState {
    container?: AwilixContainer;
  }
}
