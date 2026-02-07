import Ajv from "ajv";
import addFormats from "ajv-formats";
import ValidationException from "../common/ValidationException";
import StateSchema from "../state/state.model";
import CitySchema from "../city/city.model";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateState = ajv.compile(StateSchema() as object);
const validateCity = ajv.compile(CitySchema() as object);

export function validateStateSchema(
  payload: Record<string, unknown>,
): Record<string, unknown> | ValidationException {
  const isValid = validateState(payload);
  if (!isValid) {
    return new (ValidationException as new (
      errors: unknown,
    ) => ValidationException)(validateState.errors ?? []);
  }
  return payload;
}

export function validateCitySchema(
  payload: Record<string, unknown>,
): Record<string, unknown> | ValidationException {
  const isValid = validateCity(payload);
  if (!isValid) {
    return new (ValidationException as new (
      errors: unknown,
    ) => ValidationException)(validateCity.errors ?? []);
  }
  return payload;
}
