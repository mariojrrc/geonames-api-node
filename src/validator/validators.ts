import validator from "validator";

export function validateUUID(uuid = ""): boolean {
  return validator.isUUID(uuid, 4);
}

export function validateUrl(url = ""): boolean {
  return /(http(s?)):\/\//i.test(url);
}
