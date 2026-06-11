import { APIRequestContext } from '@playwright/test';

export interface ApiResponse<T> {
  status: number;
  ok: boolean;
  data: T;
}

export class BaseApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseURL: string,
  ) {}

  protected async get<T>(
    path: string,
    options?: { headers?: Record<string, string> },
  ): Promise<ApiResponse<T>> {
    const resp = await this.request.get(`${this.baseURL}${path}`, options);
    const data = resp.ok() ? ((await resp.json()) as T) : (null as unknown as T);
    return { status: resp.status(), ok: resp.ok(), data };
  }

  protected async post<T>(
    path: string,
    options?: { headers?: Record<string, string>; data?: unknown },
  ): Promise<ApiResponse<T>> {
    const resp = await this.request.post(`${this.baseURL}${path}`, options);
    const data = resp.ok() ? ((await resp.json()) as T) : (null as unknown as T);
    return { status: resp.status(), ok: resp.ok(), data };
  }
}
