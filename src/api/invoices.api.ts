import { APIRequestContext, expect } from "@playwright/test";
import { Invoice, InvoicePayload } from "./types";

export class InvoicesApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(payload: InvoicePayload, token: string): Promise<Invoice> {
    const res = await this.request.post("/invoices", {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
    expect(
      res.status(),
      `invoice expected 200/201, got ${res.status()}: ${await res.text()}`,
    ).toBeLessThan(300);

    const body = (await res.json()) as Invoice;
    expect(body.id, "invoice id expected").toBeTruthy();
    expect(body.invoice_number).toMatch(/^INV-/);
    return body;
  }
}
