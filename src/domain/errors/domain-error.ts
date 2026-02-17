export class DomainValidationError extends Error {
    constructor(
        message: string,
        public readonly issues: unknown
    ) {
        super(message);
    }
}