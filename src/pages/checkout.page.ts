import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export interface BillingDetails {
  street: string;
  house_number: string;
  city: string;
  state?: string;
  country: string;
  postal_code: string;
}

const PAYMENT_LABELS = {
  "cash-on-delivery": "Cash on Delivery",
  "credit-card": "Credit Card",
  "bank-transfer": "Bank Transfer",
  "buy-now-pay-later": "Buy Now Pay Later",
  "gift-card": "Gift Card",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_LABELS;

export class CheckoutPage extends BasePage {
  readonly path = "/checkout";

  constructor(page: Page) {
    super(page);
  }

  // --- Step 1: Cart review ---
  private get cartTotal() {
    return this.page.getByTestId("cart-total");
  }
  private get cartQuantity() {
    return this.page.getByTestId("cart-quantity");
  }
  private get productTitle() {
    return this.page.getByTestId("product-title");
  }
  private get proceed1() {
    return this.page.getByTestId("proceed-1");
  }

  // --- Step 2: Sign-in confirmation ---
  private get proceed2() {
    return this.page.getByTestId("proceed-2");
  }

  // --- Step 3: Billing address ---
  private get countrySelect() {
    return this.page.getByTestId("country");
  }
  private get postalCodeInput() {
    return this.page.getByTestId("postal_code");
  }
  private get houseNumberInput() {
    return this.page.getByTestId("house_number");
  }
  private get streetInput() {
    return this.page.getByTestId("street");
  }
  private get cityInput() {
    return this.page.getByTestId("city");
  }
  private get stateInput() {
    return this.page.getByTestId("state");
  }
  private get proceed3() {
    return this.page.getByTestId("proceed-3");
  }

  // --- Step 4: Payment ---
  private get paymentMethodSelect() {
    return this.page.getByTestId("payment-method");
  }
  private get finishButton() {
    return this.page.getByTestId("finish");
  }
  private get paymentSuccessMessage() {
    return this.page.getByTestId("payment-success-message");
  }

  async openWithCart(cartId: string): Promise<void> {
    // Set cart_id BEFORE Angular boots so the cart-service picks it up on init.
    await this.page.addInitScript((id: string) => {
      try {
        sessionStorage.setItem("cart_id", id);
      } catch {
        /* sessionStorage not yet available on some early-boot frames */
      }
    }, cartId);
    await this.goto();
    await expect(this.proceed1).toBeVisible({ timeout: 20_000 });
  }

  async expectCartSummary(productName: string): Promise<void> {
    await expect(this.productTitle).toContainText(productName);
    await expect(this.cartQuantity).toBeVisible();
    await expect(this.cartTotal).toBeVisible();
    const total = await this.cartTotal.innerText();
    expect(
      Number.parseFloat(total.replace(/[^0-9.]/g, "")),
      "cart total should be > 0",
    ).toBeGreaterThan(0);
  }

  async proceedToSignIn(): Promise<void> {
    await this.proceed1.click();
    await expect(this.proceed2).toBeVisible({ timeout: 10_000 });
  }

  async proceedToBilling(): Promise<void> {
    await this.proceed2.click();
    await expect(this.countrySelect).toBeVisible({ timeout: 10_000 });
  }

  async fillBillingAddress(billing: BillingDetails): Promise<void> {
    await this.countrySelect.selectOption({ label: billing.country });
    await this.postalCodeInput.fill(billing.postal_code);
    await this.houseNumberInput.fill(billing.house_number);
    await this.streetInput.fill(billing.street);
    await this.cityInput.fill(billing.city);
    if (billing.state) await this.stateInput.fill(billing.state);
  }

  async proceedToPayment(): Promise<void> {
    await expect(
      this.proceed3,
      "proceed-3 should be enabled once billing is valid",
    ).toBeEnabled({ timeout: 5_000 });
    await this.proceed3.click();
    await expect(this.paymentMethodSelect).toBeVisible({ timeout: 10_000 });
  }

  async selectPaymentMethod(method: PaymentMethod): Promise<void> {
    await this.paymentMethodSelect.selectOption({
      label: PAYMENT_LABELS[method],
    });
  }

  async expectReadyToConfirm(): Promise<void> {
    await expect(
      this.finishButton,
      "Confirm button should be visible on Payment step",
    ).toBeVisible();
    await expect(
      this.finishButton,
      "Confirm button should be enabled when COD is selected",
    ).toBeEnabled({ timeout: 5_000 });
  }

  /**
   * Click the "Confirm" button on the Payment step to complete the UI checkout.
   * The SPA fires POST /payment/check (NOT POST /invoices); on 200 it renders
   * a "Payment was successful" banner and the order is treated as confirmed.
   */
  async confirmOrder(): Promise<void> {
    const paymentCheck = this.page.waitForResponse(
      (r) =>
        r.url().includes("/payment/check") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await this.finishButton.click();
    const res = await paymentCheck;
    expect(
      res.status(),
      `payment/check should return 200, got ${res.status()}`,
    ).toBe(200);
  }

  async expectOrderConfirmation(): Promise<void> {
    await expect(
      this.paymentSuccessMessage,
      "the SPA should render a 'Payment was successful' banner",
    ).toBeVisible({ timeout: 10_000 });
    await expect(this.paymentSuccessMessage).toContainText(/successful/i);
  }
}
