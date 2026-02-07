export default class DuplicationException extends Error {
  errors: unknown;

  constructor(errors: unknown) {
    super("Duplicate entity");
    this.name = "DuplicationException";
    this.errors = errors;
    Object.setPrototypeOf(this, DuplicationException.prototype);
  }
}
