import { faker } from "@faker-js/faker";
import { RegisterPayload } from "../api/types";

// Password for ephemeral test users created against the public practice
// sandbox. Read from env so it never lives in source. Falls back to a
// non-secret default that satisfies the SUT's policy (mixed case + digit +
// symbol, not on HIBP) so the suite runs out-of-the-box.
const FALLBACK_PASSWORD = "Q7t#vN2pLwR4yK";
const STRONG_PASSWORD = process.env.TEST_USER_PASSWORD ?? FALLBACK_PASSWORD;

export interface TestUser extends RegisterPayload {
  password: string;
}

export function createTestUser(): TestUser {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  const unique = `${Date.now()}${faker.number.int({ min: 1000, max: 9999 })}`;
  return {
    first_name: first,
    last_name: last,
    email: `qa.${first.toLowerCase()}.${unique}@nawy-tests.dev`,
    password: STRONG_PASSWORD,
  };
}

export const TEST_BILLING_ADDRESS = {
  street: "Test Way",
  house_number: "1",
  city: "Vienna",
  state: "Wien",
  country: "Austria",
  postal_code: "1010",
} as const;
