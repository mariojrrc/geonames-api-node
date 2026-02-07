const path = require("path");
const validatorsPath = path.join(__dirname, "../../dist/src/validator/validators.js");
const { validateUUID, validateUrl } = require(validatorsPath);

describe("validators", () => {
  describe("validateUUID", () => {
    it("returns true for valid UUID v4", () => {
      expect(validateUUID("04696d2e-9421-4443-a927-21275c86026b")).toBe(true);
      expect(validateUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("returns false for invalid UUID", () => {
      expect(validateUUID("not-a-uuid")).toBe(false);
      expect(validateUUID("04696d2e-9421-4443-a927-21275c86026")).toBe(false);
      expect(validateUUID("")).toBe(false);
    });

    it("returns false for non-string (uses default)", () => {
      expect(validateUUID()).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("returns true for http URLs", () => {
      expect(validateUrl("http://example.com")).toBe(true);
      expect(validateUrl("http://localhost:3000")).toBe(true);
    });

    it("returns true for https URLs", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("https://api.example.com/path")).toBe(true);
    });

    it("returns false for non-URLs", () => {
      expect(validateUrl("")).toBe(false);
      expect(validateUrl("ftp://example.com")).toBe(false);
      expect(validateUrl("example.com")).toBe(false);
    });
  });
});
