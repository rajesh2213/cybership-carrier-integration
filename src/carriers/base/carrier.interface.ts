import { RateRequest, RateQuote } from "../../domain/models/rate";

export interface Carrier {
    getRates(request: RateRequest): Promise<RateQuote[]>
}