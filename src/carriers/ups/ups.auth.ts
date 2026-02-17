import { HttpClient } from "../base/http-client.interface";
import { config } from "../../infrastructure/config/config";

interface UPSAuthResponse {
    access_token: string;
    expires_in: number;
}

export class UPSAuth {
    private accessToken?: string;
    private expiresAt?: number;

    constructor(private readonly http: HttpClient) { }

    async getAccessToken(): Promise<string> {
        if (
            this.accessToken &&
            this.expiresAt &&
            Date.now() < this.expiresAt
        ) {
            return this.accessToken;
        }

        const basicAuth = Buffer.from(
            `${config.upsClientId}:${config.upsClientSecret}`
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

        this.accessToken = response.data.access_token;

        this.expiresAt =
            Date.now() + (response.data.expires_in - 60) * 1000;

        return this.accessToken;
    }
}
