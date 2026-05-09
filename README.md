# Nawy — Playwright UI + API Automation Assignment

A scalable Playwright + TypeScript framework that automates an integrated
**UI + API** end-to-end flow against
[`practicesoftwaretesting.com`](https://practicesoftwaretesting.com).

**Author:** Mazen Galal
**Stack:** Playwright 1.48 · TypeScript 5.6 · Faker 9 · Node 22

---

## What the suite covers

A single integrated test exercises all five steps from the brief, mixing
direct API calls with UI interactions on the same logical flow:

| # | Step | Channel | Validation |
|---|---|---|---|
| 1 | Create user | **API** `POST /users/register` | 201, returned `id`, echoed `email`/`first_name`/`last_name` |
| 2 | Log in with the same credentials | **UI** `/auth/login` | Successful 200 from `/users/login`, redirect to `/account`, `auth-token` in `localStorage`, account menu visible |
| 3 | Add **Ear Protection** to cart | **API** `POST /carts` + `POST /carts/:id` (Bearer) | `result: "item added or updated"`; `GET /carts/:id` confirms the line item |
| 4 | Complete payment via UI (Cash on Delivery) | **UI** `/checkout` | Walks Cart → Sign-in → Billing → Payment, fires `POST /payment/check` (200), asserts `data-test="payment-success-message"` is visible |
| 5 | Create invoice | **API** `POST /invoices` (Bearer) | 200, `invoice_number` matches `^INV-\d{10}$`, `total > 0` and `total ≤ subtotal`, billing fields echo back |

The **API → UI cart bridge** is solved by setting `sessionStorage.cart_id`
via `page.addInitScript` *before* Angular boots — the SPA's cart service then
picks up the API-created cart on its first render.

> **Note on the assignment hint** *("Click the Confirm button twice in the UI
> to locate the API call.")* — Observation showed that the SPA's Confirm
> button calls `POST /payment/check` rather than `POST /invoices`. The hint
> was guiding us to discover the **invoice payload shape** (billing fields,
> payment method, cart_id), not a UI-fired endpoint. Step 5 therefore
> exercises `POST /invoices` directly using the same cart populated in
> step 3, which the UI never consumes.

---

## Project structure

```
nawy-playwright-assignment/
├── playwright.config.ts          # cross-browser, parallel, HTML report, screenshot-on-fail, data-test selector
├── tsconfig.json                 # strict TS with @pages / @api / @fixtures / @data path aliases
├── package.json
├── src/
│   ├── api/
│   │   ├── api-client.ts         # APIRequestContext wrapper + token aggregator
│   │   ├── users.api.ts          # register / login
│   │   ├── products.api.ts       # find product by name
│   │   ├── carts.api.ts          # create / addItem / get
│   │   ├── invoices.api.ts       # create
│   │   └── types.ts              # request + response shapes
│   ├── pages/                    # POM
│   │   ├── base.page.ts          # shared navigation + visibility helpers
│   │   ├── login.page.ts         # /auth/login
│   │   └── checkout.page.ts      # /checkout 4-step wizard
│   ├── fixtures/
│   │   └── test.ts               # extends Playwright's test with `api`, `loginPage`, `checkoutPage`
│   └── data/
│       └── user.factory.ts       # faker-based unique user + billing address
└── tests/
    └── e2e/
        └── full-flow.spec.ts     # the integrated 5-step flow
```

---

## Setup

Requires Node ≥ 18 (tested on 22).

```bash
npm install
npx playwright install chromium firefox
```

`npm install` alone fetches the `@playwright/test` package; the second
command pulls the actual browser binaries (~200 MB).

---

## Running tests

| Command | What it does |
|---|---|
| `npm test` | Runs the suite on **both** Chromium and Firefox in parallel |
| `npm run test:chromium` | Chromium only |
| `npm run test:firefox` | Firefox only |
| `npm run test:headed` | Opens a real browser window |
| `npm run test:debug` | Launches the Playwright Inspector (`PWDEBUG=1`) |
| `npm run report` | Opens the last HTML report |
| `npx playwright test --workers=1` | Sequential (useful for debugging) |
| `npx playwright test --grep @smoke` | Tag-filtered runs |

After any run, `playwright-report/index.html` contains the full report
(steps, traces on failure, screenshots, videos).

### Cross-browser execution

The two browser projects are declared in `playwright.config.ts`:

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
]
```

Run a single project with `--project=<name>`. Add Edge, WebKit, or any
custom device by appending another entry to the array.

### Configuration via env vars

| Variable | Default | Purpose |
|---|---|---|
| `UI_BASE_URL` | `https://practicesoftwaretesting.com` | Override the SUT base URL |
| `API_BASE_URL` | `https://api.practicesoftwaretesting.com` | Override the API base URL |
| `TEST_USER_PASSWORD` | built-in fallback meeting the SUT's policy | Password for ephemeral test users registered during a run |
| `CI` | unset | Enables `forbidOnly`, retries=2, workers=2 |

`.env.example` ships with sensible defaults.

---

## Design choices worth flagging

- **Robust selectors** — Playwright's `testIdAttribute` is configured to
  `data-test` (the SPA's actual attribute) so the POM uses
  `page.getByTestId(...)` everywhere. No brittle CSS or XPath.
- **No hard-coded waits** — every interaction waits on a concrete locator,
  navigation, or network response. `page.waitForTimeout` is not used in the
  framework code.
- **Auto-retry on flakes** — locally `retries: 1`, in CI `retries: 2`.
  The HTML report flags any flaky tests so they are easy to triage.
- **Failure capture** — full trace, video, and screenshot are
  retained on failure (and the latter on every failure). Open with
  `npx playwright show-trace test-results/.../trace.zip`.
- **Strict TS** — `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- **Path aliases** — `@pages/*`, `@api/*`, `@fixtures/*`, `@data/*` in
  `tsconfig.json` for clean imports as the suite grows.

---

## Adding more tests

1. Add an API client in `src/api/<thing>.api.ts` and aggregate it on
   `ApiClient` (`src/api/api-client.ts`).
2. Add the corresponding POM in `src/pages/<thing>.page.ts` extending
   `BasePage`.
3. Expose either via `src/fixtures/test.ts`.
4. Author the spec in `tests/<area>/<feature>.spec.ts`. Use
   `test.step("...")` blocks for clean reporting and ship-readiness.

---

## Troubleshooting

**"Browser not installed"** → run `npx playwright install chromium firefox`.

**Login times out without an error message** — the SPA's login is a XHR;
wait on the `/users/login` response (already implemented in `LoginPage.login`).

**Cart shows empty on `/checkout` after API add** — the SPA reads
`sessionStorage.cart_id` once on init. `CheckoutPage.openWithCart()` injects
the id via `page.addInitScript` *before* navigating; if you customise the
flow, mirror that pattern.
