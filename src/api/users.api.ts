import { APIRequestContext, expect } from "@playwright/test";
import { LoginResponse, RegisterPayload, RegisteredUser } from "./types";

export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  async register(payload: RegisterPayload): Promise<RegisteredUser> {
    const res = await this.request.post("/users/register", { data: payload });
    expect(
      res.status(),
      `register expected 201, got ${res.status()}: ${await res.text()}`,
    ).toBe(201);

    const body = (await res.json()) as RegisteredUser;
    expect(body.id, "user id should be returned").toBeTruthy();
    expect(body.email).toBe(payload.email);
    expect(body.first_name).toBe(payload.first_name);
    expect(body.last_name).toBe(payload.last_name);
    return body;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.request.post("/users/login", {
      data: { email, password },
    });
    expect(res.status(), `login failed: ${await res.text()}`).toBe(200);

    const body = (await res.json()) as LoginResponse;
    expect(body.access_token, "access_token expected").toBeTruthy();
    expect(body.token_type).toBe("bearer");
    return body;
  }
}
