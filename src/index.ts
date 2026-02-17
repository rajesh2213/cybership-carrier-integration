import { config } from "./infrastructure/config/config";
import { AxiosHttpClient } from "./infrastructure/http/axios-client";
import { UPSCarrier, type UPSConfig } from "./carriers/ups/ups.carrier";
import { UPSAuth } from "./carriers/ups/ups.auth";
import { UPSMapper } from "./carriers/ups/ups.mapper";

export function createUPSCarrier(): UPSCarrier {
    const upsConfig: UPSConfig = {
        baseUrl: config.upsBaseUrl,
        clientId: config.upsClientId,
        clientSecret: config.upsClientSecret,
        ratingVersion: config.upsRatingVersion,
    };
    const http = new AxiosHttpClient(upsConfig.baseUrl);
    const auth = new UPSAuth(http, {
        clientId: upsConfig.clientId,
        clientSecret: upsConfig.clientSecret,
    });

    return new UPSCarrier(upsConfig, auth, http, UPSMapper);
}
