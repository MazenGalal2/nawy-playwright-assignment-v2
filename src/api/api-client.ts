import { APIRequestContext, request } from "@playwright/test";
import { UsersApi } from "./users.api";
import { ProductsApi } from "./products.api";
import { CartsApi } from "./carts.api";
import { InvoicesApi } from "./invoices.api";

export const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://api.practicesoftwaretesting.com";

export class ApiClient {
  readonly users: UsersApi;
  readonly products: ProductsApi;
  readonly carts: CartsApi;
  readonly invoices: InvoicesApi;

  constructor(private readonly ctx: APIRequestContext) {
    this.users = new UsersApi(ctx);
    this.products = new ProductsApi(ctx);
    this.carts = new CartsApi(ctx);
    this.invoices = new InvoicesApi(ctx);
  }

  static async create(token?: string): Promise<ApiClient> {
    const ctx = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return new ApiClient(ctx);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}
