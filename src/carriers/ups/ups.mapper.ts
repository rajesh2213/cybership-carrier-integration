import { RateQuote } from "../../domain/models/rate";
import { RateRequestSchema } from "../../domain/schemas/rate.schema";
import { z } from "zod";

type ValidatedRateRequest = z.infer<typeof RateRequestSchema>;

type ValidatedAddress = ValidatedRateRequest["origin"];

function toUPSAddress(addr: ValidatedAddress) {
    return {
        AddressLine: [addr.line1],
        City: addr.city,
        StateProvinceCode: addr.state,
        PostalCode: addr.postalCode,
        CountryCode: addr.countryCode,
    };
}

const UPSRatedShipmentSchema = z.object({
    Service: z.object({
        Code: z.string().optional(),
    }).optional(),
    TotalCharges: z.object({
        MonetaryValue: z.string(),
        CurrencyCode: z.string(),
    }),
});

const UPSRateResponseSchema = z.object({
    RateResponse: z.object({
        RatedShipment: z.array(UPSRatedShipmentSchema),
    }),
});

type UPSRatedShipmentValidated = z.infer<typeof UPSRatedShipmentSchema>;

function parseRatedShipment(shipment: UPSRatedShipmentValidated): RateQuote {
    const amount = parseFloat(shipment.TotalCharges.MonetaryValue);
    if (Number.isNaN(amount)) {
        throw new Error("Invalid TotalCharges.MonetaryValue");
    }
    return {
        carrier: "UPS",
        serviceLevel: shipment.Service?.Code ?? "UNKNOWN",
        amount,
        currency: shipment.TotalCharges.CurrencyCode,
    };
}

export interface UPSMapperType {
    toUPSRateRequest(request: ValidatedRateRequest): unknown;
    fromUPSRateResponse(response: unknown): RateQuote[];
}

export const UPSMapper: UPSMapperType = {
    toUPSRateRequest(request: ValidatedRateRequest) {
        return {
            RateRequest: {
                Shipment: {
                    Shipper: { Address: toUPSAddress(request.origin) },
                    ShipTo: { Address: toUPSAddress(request.destination) },
                    ShipFrom: { Address: toUPSAddress(request.origin) },
                    Package: request.packages.map((pkg) => ({
                        PackagingType: { Code: "02" },
                        PackageWeight: {
                            UnitOfMeasurement: {
                                Code: pkg.weightUnit === "LB" ? "LBS" : "KGS",
                            },
                            Weight: pkg.weight.toString(),
                        },
                    })),
                },
            },
        };
    },

    fromUPSRateResponse(response: unknown): RateQuote[] {
        const parsed = UPSRateResponseSchema.safeParse(response);

        if (!parsed.success) {
            throw new Error("Invalid UPS rate response");
        }

        return parsed.data.RateResponse.RatedShipment.map(parseRatedShipment);
    },
};
