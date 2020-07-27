const Ajv = require("ajv");
const { ValidationException } = require("koa-mongo-crud");
const StateSchema = require("../state/state.model");
const CitySchema = require("../city/city.model");

const ajv = new Ajv({ allErrors: true });

const validateStateSchema = (payload) => {
  const isValid = ajv.validate(StateSchema(), payload);
  if (!isValid) {
    return new ValidationException(ajv.errors);
  }
  return payload;
};

const validateCitySchema = (payload) => {
  const isValid = ajv.validate(CitySchema(), payload);
  if (!isValid) {
    return new ValidationException(ajv.errors);
  }
  return payload;
};

module.exports = {
  validateStateSchema,
  validateCitySchema,
};
