export class DomainValidationError extends Error {
    constructor(
        message: string,
        public readonly issues: unknown
    ) {
        super(message);
        this.name = "DomainValidationError";
        Object.setPrototypeOf(this, DomainValidationError.prototype);
    }
}