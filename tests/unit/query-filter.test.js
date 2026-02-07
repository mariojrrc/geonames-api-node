const path = require("path");
const useDist = path.join(__dirname, "../../dist/src/common/query-filter.js");
const { createQueryFilter } = require(useDist);

describe("query-filter", () => {
  const defaultFilter = createQueryFilter({
    whitelist: {
      name: 1,
      stateId: 1,
      count: 1,
      updatedAt: 1,
      after: 1,
      before: 1,
      between: 1,
    },
    custom: {
      after: "updatedAt",
      before: "updatedAt",
      between: "updatedAt",
    },
  });

  describe("plain string values", () => {
    it("keeps UUID strings as strings (does not coerce to number)", () => {
      const result = defaultFilter.parse({
        stateId: "04696d2e-9421-4443-a927-21275c86026b",
      });
      expect(result.stateId).toBe("04696d2e-9421-4443-a927-21275c86026b");
      expect(typeof result.stateId).toBe("string");
    });

    it("keeps arbitrary strings as strings", () => {
      const result = defaultFilter.parse({ name: "Rio de Janeiro" });
      expect(result.name).toBe("Rio de Janeiro");
    });

    it("coerces integer strings to numbers when whole string is numeric", () => {
      const result = defaultFilter.parse({ count: "42" });
      expect(result.count).toBe(42);
      expect(typeof result.count).toBe("number");
    });

    it("coerces decimal strings to numbers when whole string is numeric", () => {
      const result = defaultFilter.parse({ count: "123.45" });
      expect(result.count).toBe(123.45);
      expect(typeof result.count).toBe("number");
    });

    it("coerces true/false strings to booleans", () => {
      expect(defaultFilter.parse({ name: "true" }).name).toBe(true);
      expect(defaultFilter.parse({ name: "false" }).name).toBe(false);
    });
  });

  describe("whitelist", () => {
    it("includes only whitelisted keys", () => {
      const result = defaultFilter.parse({
        name: "x",
        stateId: "uuid-here",
        count: "1",
        other: "ignored",
      });
      expect(result).toHaveProperty("name", "x");
      expect(result).toHaveProperty("stateId", "uuid-here");
      expect(result).toHaveProperty("count", 1);
      expect(result).not.toHaveProperty("other");
    });

    it("with empty whitelist allows all keys", () => {
      const filter = createQueryFilter({ whitelist: {} });
      const result = filter.parse({ foo: "bar", stateId: "uuid" });
      expect(result.foo).toBe("bar");
      expect(result.stateId).toBe("uuid");
    });
  });

  describe("operators", () => {
    it("!value produces $ne", () => {
      const result = defaultFilter.parse({ name: "!foo" });
      expect(result.name).toEqual({ $ne: "foo" });
    });

    it("! with empty produces $exists: false", () => {
      const result = defaultFilter.parse({ name: "!" });
      expect(result.name).toEqual({ $exists: false });
    });

    it(">value produces $gt", () => {
      const result = defaultFilter.parse({ count: ">10" });
      expect(result.count).toEqual({ $gt: 10 });
    });

    it(">=value produces $gte", () => {
      const result = defaultFilter.parse({ count: ">=10" });
      expect(result.count).toEqual({ $gte: 10 });
    });

    it("<value produces $lt", () => {
      const result = defaultFilter.parse({ count: "<100" });
      expect(result.count).toEqual({ $lt: 100 });
    });

    it("<=value produces $lte", () => {
      const result = defaultFilter.parse({ count: "<=100" });
      expect(result.count).toEqual({ $lte: 100 });
    });

    it("empty string value produces $exists: true", () => {
      const result = defaultFilter.parse({ name: "" });
      expect(result.name).toEqual({ $exists: true });
    });
  });

  describe("custom date params (after/before/between)", () => {
    it("after maps to $gte on custom field", () => {
      const result = defaultFilter.parse({ after: "2020-01-01" });
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt.$gte).toBeInstanceOf(Date);
    });

    it("before maps to $lt on custom field", () => {
      const result = defaultFilter.parse({ before: "2020-12-31" });
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt.$lt).toBeInstanceOf(Date);
    });

    it("between maps to $gte and $lt on custom field", () => {
      const result = defaultFilter.parse({
        between: "2020-01-01|2020-12-31",
      });
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt.$gte).toBeInstanceOf(Date);
      expect(result.updatedAt.$lt).toBeInstanceOf(Date);
    });
  });

  describe("arrays", () => {
    it("array of values produces $in", () => {
      const result = defaultFilter.parse({ stateId: ["a", "b", "c"] });
      expect(result.stateId).toEqual({ $in: ["a", "b", "c"] });
    });

    it("array with numeric strings produces $in with numbers where applicable", () => {
      const result = defaultFilter.parse({ count: ["1", "2", "3"] });
      expect(result.count).toEqual({ $in: [1, 2, 3] });
    });
  });

  describe("key[] stripping", () => {
    it("strips [] suffix from key for whitelist and result", () => {
      const filter = createQueryFilter({ whitelist: { ids: 1 } });
      const result = filter.parse({ "ids[]": ["a", "b"] });
      expect(result.ids).toEqual({ $in: ["a", "b"] });
    });
  });

  describe("object values", () => {
    it("passes through object values as-is", () => {
      const result = defaultFilter.parse({
        name: { $regex: "test", $options: "i" },
      });
      expect(result.name).toEqual({ $regex: "test", $options: "i" });
    });
  });
});
