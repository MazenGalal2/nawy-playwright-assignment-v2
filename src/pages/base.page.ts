import { Page } from "@playwright/test";

export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }
}
