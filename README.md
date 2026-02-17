# cybership-carrier-integration

Service for integrating with shipping carrier APIs, currently implementing UPS Rating. The architecture is designed to support multiple carriers (FedEx, USPS, DHL) without modifying existing code.

## Design Decisions

**Layered architecture**: Domain models and validation are isolated from carrier implementations. The `Carrier` interface allows adding new carriers by implementing `getRates()` without touching UPS code.

**Dependency injection**: Config, HTTP client, auth, and mappers are injected rather than imported. This makes the code testable without real HTTP calls and keeps the carrier layer independent of infrastructure.

**Response validation**: UPS responses are validated with Zod schemas before mapping to domain models. This catches malformed data early and prevents runtime errors from unexpected API changes.

**OAuth token caching**: Tokens are cached in memory with a 60-second buffer before expiry. This reduces token requests while avoiding expired token errors.

## Running the Project

```bash
npm install
```

Create a `.env` file with your UPS credentials:

```
UPS_CLIENT_ID=your_client_id
UPS_CLIENT_SECRET=your_client_secret
UPS_BASE_URL=https://wwwcie.ups.com
UPS_RATING_VERSION=v2409
```

Build and run:

```bash
npm run build
npm run dev
```

Run tests:

```bash
npm test
```

Tests use a stubbed `HttpClient` that records calls and returns predefined responses. No real HTTP requests are made.

## Improvements Given More Time

**Retry logic**: Add exponential backoff for transient failures (429, 500, timeouts). The current error handling makes this straightforward.

**Better error types**: Introduce specific error classes (`RateLimitError`, `InvalidAddressError`) instead of generic `CarrierError`.

**Response caching**: Cache rate quotes by request hash for a short TTL to reduce API calls for identical requests.

**Integration tests with real API**: Add a small suite that hits the UPS sandbox with real credentials, run separately from unit tests.