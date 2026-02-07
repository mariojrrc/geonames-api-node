export default class ValidationException extends Error {
  errors?: unknown;

  constructor(messageOrErrors?: string | unknown) {
    super(
      typeof messageOrErrors === "string"
        ? messageOrErrors
        : "Validation failed",
    );
    this.name = "ValidationException";
    if (typeof messageOrErrors !== "string") {
      this.errors = messageOrErrors;
    }
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}
