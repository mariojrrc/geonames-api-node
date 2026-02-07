const path = require("path");
const utilsPath = path.join(__dirname, "../../dist/src/common/utils.js");
const {
  validateEmail,
  arrayValues,
  isEmpty,
  utcDateTime,
} = require(utilsPath);

describe("utils", () => {
  describe("validateEmail", () => {
    it("returns true for valid emails", () => {
      expect(validateEmail("a@b.co")).toBe(true);
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("User@Example.COM")).toBe(true);
    });

    it("returns false for invalid emails", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("no-at-sign")).toBe(false);
      expect(validateEmail("@nodomain.com")).toBe(false);
      expect(validateEmail("nodomain.com")).toBe(false);
    });
  });

  describe("arrayValues", () => {
    it("returns array of object values", () => {
      expect(arrayValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
      expect(arrayValues({})).toEqual([]);
    });

    it("only includes own properties", () => {
      const o = Object.create({ inherited: "x" });
      o.own = "y";
      expect(arrayValues(o)).toEqual(["y"]);
    });
  });

  describe("isEmpty", () => {
    it("returns true for empty object", () => {
      expect(isEmpty({})).toBe(true);
    });

    it("returns false for non-empty object", () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe("utcDateTime", () => {
    it("returns formatted string for Date", () => {
      const d = new Date("2020-06-15T12:30:00.000Z");
      const result = utcDateTime(d);
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.000$/);
    });

    it("accepts date string", () => {
      const result = utcDateTime("2020-06-15T12:30:00.000Z");
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.000$/);
    });
  });
});
