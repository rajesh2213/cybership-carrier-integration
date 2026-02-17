import dotenv from "dotenv";
dotenv.config()

function requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing required env variable: ${name}`)
    }

    return value;
}

export const config = {
    upsClientId: requireEnv("UPS_CLIENT_ID"),
    upsClientSecret: requireEnv("UPS_CLIENT_SECRET"),
    upsBaseUrl: requireEnv("UPS_BASE_URL"),
}