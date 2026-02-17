import axios, { AxiosInstance } from "axios";
import { HttpClient } from "../../carriers/base/http-client.interface";
import { CarrierError } from "../../domain/errors/carrier-error";

export class AxiosHttpClient implements HttpClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
        });
    }

    async post<T = unknown>(
        url: string,
        data: unknown,
        headers?: Record<string, string>
    ): Promise<{ data: T; status: number }> {
        try {
            const res = await this.client.post(url, data, {
                ...(headers && { headers }),
            });
            return {
                data: res.data,
                status: res.status,
            };
        } catch (err) {
            if (err instanceof CarrierError) throw err;
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                throw new CarrierError("HTTP request failed", status, err);
            }
            throw new CarrierError("HTTP request failed", undefined, err);
        }
    }
}