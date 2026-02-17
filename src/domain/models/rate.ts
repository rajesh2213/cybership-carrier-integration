export type ServiceLevel = "GROUND" | "TWO_DAY" | "NEXT_DAY";

export interface Address {
    name?: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
}

export interface PackageDimensions {
    length: number;
    width: number;
    height: number;
    unit: "IN" | "CM";
}

export interface Package {
    weight: number;
    weightUnit: "LB" | "KG";
    dimensions?: PackageDimensions;
}

export interface RateRequest {
    origin: Address;
    destination: Address;
    packages: Package[];
    serviceLevel: ServiceLevel;
}

export interface RateQuote {
    carrier: string;
    serviceLevel: string;
    amount: number;
    currency: string;
    estimatedDeliveryDays?: number;
}