import { RateRequestSchema } from "../schemas/rate.schema";
import { DomainValidationError } from "../errors/domain-error";

export function validateRateRequest(input: unknown) {
    const res = RateRequestSchema.safeParse(input)

    if(!res.success) {
        throw new DomainValidationError(
            "Invalid rate request",
            res.error.flatten()
        )
    }

    return res.data;
}