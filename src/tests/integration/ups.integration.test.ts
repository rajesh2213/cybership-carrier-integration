import { describe, it, expect } from "vitest";
import type { HttpClient } from "../../carriers/base/http-client.interface";
import { UPSCarrier, type UPSConfig } from "../../carriers/ups/ups.carrier";
import { UPSAuth } from "../../carriers/ups/ups.auth";
import { UPSMapper } from "../../carriers/ups/ups.mapper";
import { CarrierError } from "../../domain/errors/carrier-error";
import type { RateRequest } from "../../domain/models/rate";

type StubResponse = { data: unknown; status: number } | { throw: Error };

class StubHttpClient implements HttpClient {
    readonly calls: Array<{
        url: string;
        data: unknown;
        headers?: Record<string, string>;
    }> = [];

    private stubs = new Map<string, StubResponse[]>();

    stub(url: string, response: StubResponse) {
        const queue = this.stubs.get(url) ?? [];
        queue.push(response);
        this.stubs.set(url, queue);
    }

    async post<T>(
        url: string,
        data: unknown,
        headers?: Record<string, string>
    ): Promise<{ data: T; status: number }> {
        this.calls.push({ url, data, ...(headers != null && { headers }) });

        const queue = this.stubs.get(url);
        if (!queue?.length) {
            throw new Error(`No stub for URL: ${url}`);
        }

        const next = queue.shift()!;
        if ("throw" in next) {
            throw next.throw;
        }

        if (next.status >= 400) {
            throw new CarrierError(
                `HTTP error ${next.status}`,
                next.status,
                next.data
            );
        }

        return { data: next.data as T, status: next.status };
    }
}

const TOKEN_URL = "/security/v1/oauth/token";
const VERSION = "v2409";
const RATING_URL = `/api/rating/${VERSION}/Shop`;

function createCarrier(http: HttpClient): UPSCarrier {
    const config: UPSConfig = {
        baseUrl: "https://wwwcie.ups.com",
        clientId: "test-id",
        clientSecret: "test-secret",
        ratingVersion: VERSION,
    };

    const auth = new UPSAuth(http, {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
    });

    return new UPSCarrier(config, auth, http, UPSMapper);
}

const validRequest: RateRequest = {
    origin: {
        line1: "Tower 2, 5th Floor, IT Park",
        city: "Bengaluru",
        state: "KA",
        postalCode: "560103",
        countryCode: "IN",
    },
    destination: {
        line1: "shibuya cross",
        city: "Tokyo",
        state: "Tokyo",
        postalCode: "400120",
        countryCode: "JP",
    },
    packages: [{ weight: 5, weightUnit: "LB" }],
    serviceLevel: "GROUND",
};

function tokenResponse(token = "test-token") {
    return {
        status: 200,
        data: {
            access_token: token,
            expires_in: 3600,
        },
    };
}

function ratingResponse(amount: string, currency = "USD") {
    return {
        status: 200,
        data: {
            RateResponse: {
                RatedShipment: [
                    {
                        Service: { Code: "03" },
                        TotalCharges: {
                            MonetaryValue: amount,
                            CurrencyCode: currency,
                        },
                    },
                ],
            },
        },
    };
}


describe("UPSCarrier integration", () => {
    it("builds correct request and returns normalized rate", async () => {
        const http = new StubHttpClient();
        http.stub(TOKEN_URL, tokenResponse());
        http.stub(RATING_URL, ratingResponse("42.50"));

        const carrier = createCarrier(http);
        const result = await carrier.getRates(validRequest);

        const ratingCall = http.calls.find((c) => c.url === RATING_URL);
        expect(ratingCall).toBeDefined();
        expect(ratingCall?.headers?.Authorization).toBe("Bearer test-token");

        expect(result).toEqual([
            {
                carrier: "UPS",
                serviceLevel: "03",
                amount: 42.5,
                currency: "USD",
            },
        ]);
    });

    it("reuses OAuth token across multiple calls", async () => {
        const http = new StubHttpClient();
        http.stub(TOKEN_URL, tokenResponse("cached-token"));
        http.stub(RATING_URL, ratingResponse("10.00"));
        http.stub(RATING_URL, ratingResponse("20.00"));

        const carrier = createCarrier(http);

        await carrier.getRates(validRequest);
        await carrier.getRates(validRequest);

        const tokenCalls = http.calls.filter((c) => c.url === TOKEN_URL);
        expect(tokenCalls).toHaveLength(1);
    });

    it("throws error on malformed UPS response", async () => {
        const http = new StubHttpClient();
        http.stub(TOKEN_URL, tokenResponse());
        http.stub(RATING_URL, {
            status: 200,
            data: { RateResponse: { RatedShipment: "invalid" } },
        });

        const carrier = createCarrier(http);

        await expect(carrier.getRates(validRequest)).rejects.toBeInstanceOf(
            CarrierError
        );
    });
});

// Additional scenarios like rate limiting, network timeouts, http failures and token expiry refresh can be tested similarly by extending the StubHttpClient