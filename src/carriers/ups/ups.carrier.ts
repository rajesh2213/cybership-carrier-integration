import { Carrier } from "../base/carrier.interface";
import { RateRequest, RateQuote } from "../../domain/models/rate";
import { validateRateRequest } from "../../domain/validators/validate-rate-request";
import { HttpClient } from "../base/http-client.interface";
import { CarrierError } from "../../domain/errors/carrier-error";
import { UPSAuth } from "./ups.auth";
import { type UPSMapperType } from "./ups.mapper";

export interface UPSConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    ratingVersion: string;
}

export class UPSCarrier implements Carrier {
    constructor(
        private readonly config: UPSConfig,
        private readonly auth: UPSAuth,
        private readonly http: HttpClient,
        private readonly mapper: UPSMapperType
    ) { }

    async getRates(request: RateRequest): Promise<RateQuote[]> {
        const validated = validateRateRequest(request);

        try {
            const token = await this.auth.getAccessToken();
            const upsPayload = this.mapper.toUPSRateRequest(validated);
            const url = `/api/rating/${this.config.ratingVersion}/Shop`;
            
            const response = await this.http.post(
                url,
                upsPayload,
                {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            );

            return this.mapper.fromUPSRateResponse(response.data);
        } catch (err) {
            if (err instanceof CarrierError) throw err;
            throw new CarrierError("UPS request failed", undefined, err);
        }
    }
}
