import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly path = "/auth/login";

  constructor(page: Page) {
    super(page);
  }

  private get emailInput() {
    return this.page.getByTestId("email");
  }
  private get passwordInput() {
    return this.page.getByTestId("password");
  }
  private get submitButton() {
    return this.page.getByTestId("login-submit");
  }
  private get loginForm() {
    return this.page.getByTestId("login-form");
  }
  private get accountMenu() {
    return this.page.getByTestId("nav-menu");
  }
  private get signInLink() {
    return this.page.getByTestId("nav-sign-in");
  }

  async login(email: string, password: string): Promise<void> {
    await this.goto();
    // Generous timeout: Firefox boot under parallel load can take ~15s.
    await expect(this.loginForm).toBeVisible({ timeout: 20_000 });
    // Angular's reactive form wires the click handler asynchronously after
    // chunks load — wait for the submit button to be enabled so we don't
    // race a click against an un-wired button.
    await expect(this.submitButton).toBeEnabled({ timeout: 10_000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    const loginResponse = this.page.waitForResponse(
      (r) => r.url().includes("/users/login") && r.request().method() === "POST",
      { timeout: 30_000 },
    );
    await this.submitButton.click();
    const res = await loginResponse;
    if (res.status() !== 200) {
      throw new Error(
        `UI login failed: ${res.status()} ${await res.text()}`,
      );
    }
    await this.page.waitForURL(/\/account/, { timeout: 15_000 });
  }

  async expectLoggedIn(): Promise<void> {
    // Check the auth-token first — set synchronously by the SPA on the
    // login response and the most reliable signal that auth succeeded.
    expect(
      await this.page.evaluate(() => localStorage.getItem("auth-token")),
      "SPA should store auth-token in localStorage",
    ).toBeTruthy();
    // Nav re-render lags slightly behind auth state; give it room.
    await expect(
      this.accountMenu,
      "logged-in user should see account menu trigger in nav",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      this.signInLink,
      "logged-in user should NOT see Sign-In link",
    ).toBeHidden();
  }
}
