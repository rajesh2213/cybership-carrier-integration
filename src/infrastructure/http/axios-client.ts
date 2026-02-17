import axios, { AxiosInstance } from "axios";
import { HttpClient } from "../../carriers/base/http-client.interface";

export class AxiosHttpClient implements HttpClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: 5000
        })
    }

    async post<T = any>(
        url: string,
        data: unknown,
        headers?: Record<string, string>
    ): Promise<{ data: T; status: number}> {
        const res = await this.client.post(url, data, {
            ...(headers && { headers })
        });

        return {
            data: res.data,
            status: res.status,
        }
    }
}