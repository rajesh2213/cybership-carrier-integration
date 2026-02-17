import { z } from "zod";

export const AddressSchema = z.object({
    name: z.string().optional(),
    line1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
})

export const PackageDimensionsSchema = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(["IN", "CM"]),
})

export const PackageSchema = z.object({
    weight: z.number().positive(),
    weightUnit: z.enum(["LB", "KG"]),
    dimensions: PackageDimensionsSchema.optional(),
})

export const RateRequestSchema = z.object({
    origin: AddressSchema,
    destination: AddressSchema,
    packages: z.array(PackageSchema).min(1),
    serviceLevel: z.enum(["GROUND", "TWO_DAY", "NEXT_DAY"]),
})