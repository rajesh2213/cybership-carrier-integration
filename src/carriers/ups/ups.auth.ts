import { HttpClient } from "../base/http-client.interface";
import { CarrierError } from "../../domain/errors/carrier-error";

interface UPSAuthResponse {
    access_token: string;
    expires_in: number;
}

export interface UPSAuthConfig {
    clientId: string;
    clientSecret: string;
}

export class UPSAuth {
    private accessToken?: string;
    private expiresAt?: number;

    constructor(
        private readonly http: HttpClient,
        private readonly config: UPSAuthConfig
    ) {}

    async getAccessToken(): Promise<string> {
        if (
            this.accessToken &&
            this.expiresAt &&
            Date.now() < this.expiresAt
        ) {
            return this.accessToken;
        }

        try {
            const basicAuth = Buffer.from(
                `${this.config.clientId}:${this.config.clientSecret}`
            ).toString("base64");

            const response = await this.http.post<UPSAuthResponse>(
                "/security/v1/oauth/token",
                new URLSearchParams({
                    grant_type: "client_credentials",
                }).toString(),
                {
                    Authorization: `Basic ${basicAuth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            );

            const { access_token, expires_in } = response.data;

            if (typeof access_token !== "string" || typeof expires_in !== "number") {
                throw new CarrierError("Invalid UPS OAuth response", undefined, undefined);
            }

            this.accessToken = access_token;
            this.expiresAt = Date.now() + (expires_in - 60) * 1000;

            return this.accessToken;
        } catch (err) {
            if (err instanceof CarrierError) throw err;
            const status = err && typeof err === "object" && "status" in err
                ? (err as { status?: number }).status
                : undefined;
            throw new CarrierError("UPS auth failed", status, err);
        }
    }
}
