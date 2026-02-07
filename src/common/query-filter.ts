/**
 * Parses query params into a MongoDB filter object.
 * Replaces koa-mongo-crud's MongoQF for searchable fields and date range (after/before/between).
 */

const OPS = ["!", "^", "$", "~", ">", "<", "$in"];

export interface QueryFilterOptions {
  whitelist: Record<string, number>;
  custom?: {
    after?: string;
    before?: string;
    between?: string;
  };
}

function parseDate(value: unknown): Date {
  if (typeof value === "number" && !Number.isNaN(value)) {
    const str = String(value);
    const ms = str.length === 10 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    if (!Number.isNaN(num)) {
      const ms = value.length === 10 ? num * 1000 : num;
      return new Date(ms);
    }
    return new Date(value);
  }
  return new Date(Number(value));
}

function parseStringVal(
  string: string,
  opts: { toBoolean?: boolean; toNumber?: boolean } = {},
): string | number | boolean {
  const { toBoolean = true, toNumber = true } = opts;
  if (toBoolean && string.toLowerCase() === "true") return true;
  if (toBoolean && string.toLowerCase() === "false") return false;
  if (toNumber) {
    const n = parseInt(string, 10);
    if (!Number.isNaN(n) && String(n) === string) return n;
    const f = parseFloat(string);
    if (!Number.isNaN(f)) return f;
  }
  return string;
}

export function createQueryFilter(options: QueryFilterOptions): {
  parse: (params: unknown) => Record<string, unknown>;
} {
  const whitelist = options.whitelist ?? {};
  const custom = options.custom ?? {};

  function parseString(
    str: string,
    isArray: boolean,
  ): { field: string; value: unknown; options?: string } {
    const op = str[0] ?? "";
    const eq = str[1] === "=";
    const rest = str.substring(eq ? 2 : 1) ?? "";
    const val = parseStringVal(rest);

    switch (op) {
      case "!":
        if (isArray) return { field: "$nin", value: [val] };
        if (rest === "") return { field: "$exists", value: false };
        return { field: "$ne", value: val };
      case ">":
        return { field: eq ? "$gte" : "$gt", value: val };
      case "<":
        return { field: eq ? "$lte" : "$lt", value: val };
      case "^":
      case "$":
      case "~":
        return {
          field: "$regex",
          value: rest.replace(/[^a-z0-9_.* ]/gi, ""),
          options: "i",
        };
      default:
        if (isArray) return { field: "$in", value: val };
        if (rest === "") return { field: "$exists", value: true };
        return { field: "$eq", value: parseStringVal(rest) };
    }
  }

  return {
    parse(query: unknown): Record<string, unknown> {
      const params = query as Record<string, unknown>;
      const res: Record<string, unknown> = {};
      const hasWhitelist = Object.keys(whitelist).length > 0;

      Object.keys(params).forEach((k) => {
        const key = k.replace(/\[\]$/, "");
        const val = params[k];

        if (hasWhitelist && !whitelist[key]) return;

        const customKey = custom[key as keyof typeof custom];
        if (typeof customKey === "string") {
          const field = customKey;
          if (key === "after" && typeof val === "string") {
            const date = parseDate(val);
            if (!Number.isNaN(date.getTime())) {
              res[field] = { $gte: date };
            }
          } else if (key === "before" && typeof val === "string") {
            const date = parseDate(val);
            if (!Number.isNaN(date.getTime())) {
              res[field] = { $lt: date };
            }
          } else if (key === "between" && typeof val === "string") {
            const [afterVal, beforeVal] = val.split("|");
            const after = parseDate(afterVal);
            const before = parseDate(beforeVal);
            if (
              !Number.isNaN(after.getTime()) &&
              !Number.isNaN(before.getTime())
            ) {
              res[field] = { $gte: after, $lt: before };
            }
          }
          return;
        }

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          res[key] = val;
          return;
        }

        if (Array.isArray(val)) {
          if (
            val.length > 0 &&
            typeof val[0] === "string" &&
            OPS.includes(val[0][0])
          ) {
            const parsed = parseString(val[0], true);
            res[key] = { [parsed.field]: parsed.value };
          } else {
            res[key] = { $in: val.map((v) => parseStringVal(String(v))) };
          }
          return;
        }

        if (typeof val !== "string") return;

        if (!val) {
          res[key] = { $exists: true };
        } else if (OPS.includes(val[0])) {
          const parsed = parseString(val, false);
          if (parsed.options) {
            res[key] = {
              [parsed.field]: parsed.value,
              $options: parsed.options,
            };
          } else {
            res[key] = { [parsed.field]: parsed.value };
          }
        } else {
          res[key] = parseStringVal(val);
        }
      });

      return res;
    },
  };
}
