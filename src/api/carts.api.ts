import { APIRequestContext, expect } from "@playwright/test";
import { Cart } from "./types";

export class CartsApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(): Promise<Cart> {
    const res = await this.request.post("/carts");
    expect(res.status()).toBe(201);

    const body = (await res.json()) as Cart;
    expect(body.id, "cart id expected").toBeTruthy();
    return body;
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    token: string,
  ): Promise<void> {
    const res = await this.request.post(`/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { product_id: productId, quantity },
    });
    expect(
      res.status(),
      `add-item expected 200/201, got ${res.status()}: ${await res.text()}`,
    ).toBeLessThan(300);

    const body = await res.json();
    expect(body.result).toMatch(/added|updated/i);
  }

  async get(cartId: string, token: string): Promise<unknown> {
    const res = await this.request.get(`/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    return res.json();
  }
}
