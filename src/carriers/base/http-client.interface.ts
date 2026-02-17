export interface HttpClient {
    post<T = any>(
        url: string,
        data: unknown,
        headers?: Record<string, string>
    ): Promise<{
        data: T;
        status: number;
    }>;
}
