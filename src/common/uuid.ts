import { v4 as uuidV4 } from "uuid";

/**
 * Generate a UUID v4 string. Uses the same API as the previous koa-mongo-crud Uuid.v4c.
 */
export function generateUuid(): string {
  return uuidV4();
}

export const Uuid = {
  v4c: (): string => uuidV4(),
};
