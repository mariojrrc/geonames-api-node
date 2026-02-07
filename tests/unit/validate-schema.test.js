const path = require("path");
const schemaPath = path.join(__dirname, "../../dist/src/validator/validate-schema.js");
const { validateStateSchema, validateCitySchema } = require(schemaPath);

describe("validate-schema", () => {
  describe("validateStateSchema", () => {
    it("returns payload when valid", () => {
      const payload = { name: "Rio de Janeiro", shortName: "RJ" };
      const result = validateStateSchema(payload);
      expect(result).toEqual(payload);
      expect(result).not.toBeInstanceOf(Error);
    });

    it("returns ValidationException when name is missing", () => {
      const payload = { shortName: "RJ" };
      const result = validateStateSchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
      expect(result.errors).toBeDefined();
    });

    it("returns ValidationException when shortName is missing", () => {
      const payload = { name: "Rio" };
      const result = validateStateSchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
    });

    it("returns ValidationException when name is empty string", () => {
      const payload = { name: "", shortName: "RJ" };
      const result = validateStateSchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
    });
  });

  describe("validateCitySchema", () => {
    const validStateId = "04696d2e-9421-4443-a927-21275c86026b";

    it("returns payload when valid", () => {
      const payload = { name: "Rio de Janeiro", stateId: validStateId };
      const result = validateCitySchema(payload);
      expect(result).toEqual(payload);
      expect(result).not.toBeInstanceOf(Error);
    });

    it("returns ValidationException when name is missing", () => {
      const payload = { stateId: validStateId };
      const result = validateCitySchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
    });

    it("returns ValidationException when stateId is missing", () => {
      const payload = { name: "Rio" };
      const result = validateCitySchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
    });

    it("returns ValidationException when stateId is not a valid UUID", () => {
      const payload = { name: "Rio", stateId: "not-a-uuid" };
      const result = validateCitySchema(payload);
      expect(result.constructor.name).toBe("ValidationException");
    });
  });
});
