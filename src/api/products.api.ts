import { APIRequestContext, expect } from "@playwright/test";
import { Product, ProductSearchResponse } from "./types";

export class ProductsApi {
  constructor(private readonly request: APIRequestContext) {}

  async findByName(name: string): Promise<Product> {
    const res = await this.request.get("/products/search", {
      params: { q: name },
    });
    expect(res.status()).toBe(200);

    const body = (await res.json()) as ProductSearchResponse;
    const match = body.data.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    expect(
      match,
      `product "${name}" not found in search results (${body.data.length} hits)`,
    ).toBeDefined();
    return match!;
  }
}
