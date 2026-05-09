import { test, expect } from "../../src/fixtures/test";
import { createTestUser, TEST_BILLING_ADDRESS } from "../../src/data/user.factory";

test.describe("End-to-end UI + API flow @smoke", () => {
  test("create user (API) -> login (UI) -> add to cart (API) -> checkout (UI) -> create invoice (API)", async ({
    api,
    loginPage,
    checkoutPage,
    page,
  }) => {
    const user = createTestUser();

    // STEP 1 — Create user via API with a randomized email
    await test.step("Step 1: Create user via API", async () => {
      const created = await api.users.register(user);
      expect(created.email).toBe(user.email);
      expect(created.id).toMatch(/^[0-9a-z]{20,}$/i);
      expect(created.created_at).toBeTruthy();
    });

    // STEP 2 — Log in via UI with the same credentials
    const token = await test.step("Step 2: Log in via UI with same credentials", async () => {
      await loginPage.login(user.email, user.password);
      await loginPage.expectLoggedIn();
      const t = await page.evaluate(() => localStorage.getItem("auth-token"));
      expect(t, "auth-token must be present after UI login").toBeTruthy();
      return t!;
    });

    // STEP 3 — Add Ear Protection to cart via authenticated API
    const cart = await test.step("Step 3: Add Ear Protection to cart via API", async () => {
      const product = await api.products.findByName("Ear Protection");
      expect(product.in_stock).toBe(true);

      const newCart = await api.carts.create();
      await api.carts.addItem(newCart.id, product.id, 1, token);

      const cartData = (await api.carts.get(newCart.id, token)) as {
        cart_items: Array<{ product_id: string; quantity: number }>;
      };
      expect(
        cartData.cart_items.some(
          (i) => i.product_id === product.id && i.quantity === 1,
        ),
        "cart should contain Ear Protection x1",
      ).toBe(true);
      return { id: newCart.id, productName: product.name };
    });

    // STEP 4 — Complete payment via UI:
    // Drive cart -> sign-in -> billing -> payment, choose Cash on Delivery,
    // click Confirm, and validate the "Payment was successful" banner.
    // (The SPA's Confirm button fires POST /payment/check on success and does
    //  NOT call POST /invoices — that's purely an API responsibility, exercised
    //  in Step 5.)
    await test.step("Step 4: Complete checkout via UI (Cash on Delivery)", async () => {
      await checkoutPage.openWithCart(cart.id);
      await checkoutPage.expectCartSummary(cart.productName);
      await checkoutPage.proceedToSignIn();
      await checkoutPage.proceedToBilling();
      await checkoutPage.fillBillingAddress({ ...TEST_BILLING_ADDRESS });
      await checkoutPage.proceedToPayment();
      await checkoutPage.selectPaymentMethod("cash-on-delivery");
      await checkoutPage.expectReadyToConfirm();
      await checkoutPage.confirmOrder();
      await checkoutPage.expectOrderConfirmation();
    });

    // STEP 5 — Create the invoice via API.
    // Following the assignment hint ("click Confirm twice in the UI to locate
    // the API call"), the invoice creation lives at POST /invoices. We exercise
    // it directly using the same cart populated in Step 3.
    await test.step("Step 5: Create invoice via API and validate response", async () => {
      const invoice = await api.invoices.create(
        {
          payment_method: "cash-on-delivery",
          payment_details: {},
          billing_street: `${TEST_BILLING_ADDRESS.house_number} ${TEST_BILLING_ADDRESS.street}`,
          billing_city: TEST_BILLING_ADDRESS.city,
          billing_state: TEST_BILLING_ADDRESS.state,
          billing_country: TEST_BILLING_ADDRESS.country,
          billing_postal_code: TEST_BILLING_ADDRESS.postal_code,
          cart_id: cart.id,
        },
        token,
      );

      expect(invoice.invoice_number).toMatch(/^INV-\d{10}$/);
      expect(invoice.user_id).toBeTruthy();
      expect(invoice.subtotal).toBeGreaterThan(0);
      expect(invoice.total).toBeGreaterThan(0);
      expect(invoice.total).toBeLessThanOrEqual(invoice.subtotal);
      expect(invoice.billing_country).toBe(TEST_BILLING_ADDRESS.country);
    });
  });
});
