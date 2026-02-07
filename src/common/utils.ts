import moment from "moment";
import type { Context } from "koa";

export function validateEmail(email: string): boolean {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function getDateFormat(
  ctx: Context & { t?: (key: string) => string },
  date: string | undefined,
): string | undefined {
  if (
    date &&
    /(0[1-9]|[12]\d|3[01])\/(0[1-9]|[12]\d|3[01])\/([12]\d{3})/.test(date)
  ) {
    return moment.utc(date, ctx.t?.("GLOBAL.DATE_FORMAT")).toISOString();
  }
  return date;
}

export function asyncHandler<T>(
  fn: Promise<T>,
): Promise<[null, T] | [Error, undefined]> {
  return fn
    .then((result) => [null, result] as [null, T])
    .catch((err) => Promise.reject(err));
}

export function arrayValues<T>(a: Record<string, T>): T[] {
  const array: T[] = [];
  for (const key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      array.push(a[key]);
    }
  }
  return array;
}

export function utcDateTime(date: Date | string): string {
  return `${moment(date).format("YYYY-MM-DD hh:mm:ss")}.000`;
}

export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}
