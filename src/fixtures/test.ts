import { test as base } from "@playwright/test";
import { ApiClient } from "../api/api-client";
import { LoginPage } from "../pages/login.page";
import { CheckoutPage } from "../pages/checkout.page";

interface Fixtures {
  api: ApiClient;
  loginPage: LoginPage;
  checkoutPage: CheckoutPage;
}

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const client = await ApiClient.create();
    await use(client);
    await client.dispose();
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from "@playwright/test";
