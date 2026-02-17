export class CarrierError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = "CarrierError";
        Object.setPrototypeOf(this, CarrierError.prototype);
    }
}
