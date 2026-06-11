# Knowledge Assistant — Test Suite

Automated test suite for the [Knowledge Assistant](https://main-knowledge-assistant.newpage.workers.dev/) — a RAG-based internal document assistant that answers employee questions by retrieving content from a curated policy library.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later |

---

## Installation

```bash
npm install
npx playwright install chromium
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://main-knowledge-assistant.newpage.workers.dev` | Base URL for all requests |

Override for a local or staging environment:

```bash
BASE_URL=http://localhost:8787 npm test
```

---

## Running tests

```bash
# All tests (API + UI)
npm test

# API tests only — fast, no browser, safe to run in any environment
npm run test:api

# UI tests only — requires a headed Chromium installation
npm run test:ui

# Open the HTML report after a run
npm run test:report
```

### Output

| Format | Location | Purpose |
|--------|----------|---------|
| Terminal (list) | stdout | Live progress during the run |
| HTML report | `playwright-report/index.html` | Rich visual report with screenshots and traces |
| JUnit XML | `test-results/results.xml` | CI integration (GitHub Actions, Jenkins, etc.) |

Failure diagnostics are captured automatically:
- **Screenshot** — taken on every test failure
- **Trace** — recorded on first retry; open with `npx playwright show-trace <trace.zip>`
- **Video** — recorded on first retry

---

## Project structure

```
src/
├── pages/
│   ├── base.page.ts          # Abstract BasePage — navigate() helper, protected page ref
│   └── AssistantPage.ts      # Page Object for the Knowledge Assistant UI
│
├── services/
│   ├── base.api.service.ts   # BaseApiClient — generic get/post wrapping APIRequestContext
│   └── knowledge/
│       ├── knowledge.api.service.ts   # Domain service: query(), documents(), raw variants
│       ├── endpoints.enum.ts          # KnowledgeEndpoints enum (/query, /documents)
│       └── dto/
│           ├── document.dto.ts        # Region, LifecycleState, Audience enums + DocumentDto
│           ├── query.dto.ts           # Role enum + QueryRequestDto / QueryResponseDto
│           └── access-rules.ts        # FORBIDDEN_DOC_IDS, ALLOWED_REGIONS, ALLOWED_AUDIENCES
│
├── tests/
│   ├── api/
│   │   ├── documents.spec.ts  # GET /documents — full region × role matrix + presence checks
│   │   ├── query.spec.ts      # POST /query — data-driven from golden_questions.json
│   │   └── validation.spec.ts # Header validation — missing/invalid values must return 400
│   └── ui/
│       ├── fixtures.ts        # Playwright fixture: { app } pre-navigated AssistantPage
│       └── assistant.spec.ts  # Browser tests — panel rendering, citations, interaction
│
└── utils/
    ├── assertion.ts      # Low-level assertion primitives (expect.soft wrappers)
    ├── assertions.ts     # GoldenQuestion interface + assertQueryResponse orchestrator
    ├── fixtures.ts       # QueryResponse type alias
    └── golden.ts         # Loads golden_questions.json; goldenByTag(), goldenWhere()
        └── testData/
            └── golden_questions.json   # 28 golden test cases across 6 rule categories
```

---

## Architecture

### API layer — service pattern

All HTTP calls go through `BaseApiClient`, which wraps Playwright's `APIRequestContext` and returns a typed `ApiResponse<T>`:

```
BaseApiClient
    └── KnowledgeApiService
            ├── query(region, role, question)      → ApiResponse<QueryResponseDto>
            ├── documents(region, role)             → ApiResponse<DocumentDto[]>
            ├── queryRaw(headers, question)         → ApiResponse (for header validation tests)
            └── documentsRaw(headers)               → ApiResponse (for header validation tests)
```

Tests receive a `KnowledgeApiService` instance via `{ request, baseURL }` and call service methods directly — no raw `fetch` or `axios` in test files.

### UI layer — Page Object Model

```
BasePage (abstract)
    └── AssistantPage
            ├── Locators (readonly, constructor-initialized, data-testid-based)
            ├── Actions:  setRegion(), setRole(), setUser(), ask()
            └── Extractors: getDocIds(), getDocStates(), getCitationChipIds(), getAnswer()
```

The `ask()` method handles the two-state loading sequence ("Answers will appear here." → "Thinking..." → answer) by waiting for both intermediate texts to be absent before returning.

Tests import from `src/tests/ui/fixtures.ts`:

```typescript
import { test, expect } from './fixtures';

test('example', async ({ app }) => {
  // app is an AssistantPage already navigated to '/'
  // and waited for the initial docs panel to populate
  await app.setUser('Americas', 'Employee');
  await app.ask('What is my meal allowance?');
});
```

### Golden questions — data-driven API tests

`query.spec.ts` is driven entirely by `golden_questions.json`. Each entry defines:

| Field | Purpose |
|-------|---------|
| `tags` | Which rule category this case tests (`lifecycle`, `role-access`, `region-access`, `citation`, `guardrail`, `refusal`) |
| `expect_citations` | Doc IDs that must appear in citations |
| `expect_citations_exclude` | Doc IDs that must never appear |
| `answer_must_contain` | Keywords that must appear (AND logic) |
| `answer_must_contain_any` | Keywords where at least one must appear (OR logic — resilient to model rephrasing) |
| `answer_must_not_contain` | Keywords that must not appear |
| `expect_refusal` | Whether the answer must be a refusal |

Adding a test case requires only a new JSON entry — `query.spec.ts` picks it up automatically.

### Soft assertions

All assertion primitives use `expect.soft()`. This means a single test reports all failures rather than stopping at the first, making it much easier to see the full extent of an access-control bug across a region/role matrix in one run.

---

## Test categories

### `documents.spec.ts` — GET /documents

Runs the full **3 × 4 = 12 region/role matrix** plus positive presence checks:

- Every combination returns HTTP 200
- No forbidden lifecycle states (Draft, In Review, Retired) in any response
- No out-of-region documents returned
- No out-of-role documents returned
- Expected documents present for authorised users (positive check — catches under-filtering)

### `query.spec.ts` — POST /query

Data-driven from 28 golden questions across 6 rule categories:

| Describe block | What it verifies |
|----------------|-----------------|
| Lifecycle exclusion | Draft / In Review / Retired docs never cited |
| Role access control | Role-restricted docs only cited for the correct role |
| Region access control | Region-scoped docs only cited for the correct region |
| Citation correctness | Citations point to the doc that supports the answer |
| Guardrails | Prompt injection cannot override access rules |
| Refusal | Out-of-scope questions return a refusal, not a hallucination |

### `validation.spec.ts` — Header validation

- Missing `X-User-Region` → 400
- Missing `X-User-Role` → 400
- Missing both headers → 400
- Invalid region value → 400
- Invalid role value → 400

Tested for both `POST /query` and `GET /documents`.

### `assistant.spec.ts` — Browser (UI)

Tests that are only possible in a real browser:

- Document panel renders the correct docs per region/role (client-side filtering)
- Panel updates immediately on dropdown change (no page reload)
- No forbidden state labels ("In Review", "Retired", "Draft") visible in panel text
- Citation chips appear after a question and contain valid doc IDs
- Citation chips reference docs that appear in the visible panel (cross-layer consistency)
- Asking a second question replaces the previous answer
- Forbidden doc chips (D-003, D-005) never rendered regardless of API response
- Role-restricted doc chip (D-007) not rendered for wrong role

---

## Known test failures

The following tests fail against the live environment because they document confirmed product defects, not test code issues. They will pass once the corresponding bug is fixed.

| Test file | Failing tests | Defect |
|-----------|--------------|--------|
| `documents.spec.ts` | All lifecycle / region / role scoping tests | **BUG-005** — `GET /documents` ignores all access controls and returns all 9 docs to every caller |
| `query.spec.ts` | Lifecycle tests for D-003, D-005 | **BUG-001/002** — In Review and Retired documents surface in query responses |
| `query.spec.ts` | Role access tests for D-007 | **BUG-003** — Manager-only document exposed to Employee role |
| `query.spec.ts` | Citation correctness for EMEA travel | **BUG-006** — EMEA travel answer cites D-001 (Americas) instead of D-002 (EMEA) |
| `query.spec.ts` | Guardrail test | **BUG-004** — Direct prompt injection bypasses lifecycle and role controls |
| `validation.spec.ts` | All 9 header validation tests | **BUG-007/008** — Missing or invalid headers silently default to Americas/Employee instead of returning 400 |
| `assistant.spec.ts` | D-005 chip test | **BUG-002** — Retired remote work policy chip rendered in UI |
| `assistant.spec.ts` | D-003 chip test | **BUG-001** — In Review APAC travel policy chip rendered in UI |
| `assistant.spec.ts` | D-007 chip test | **BUG-003** — Manager-only compensation chip rendered for Employee |

Full defect details including reproduction steps and impact are in [`defects.md`](./defects.md).

---

## Defects and test strategy

- [`defects.md`](./defects.md) — 11 defect reports (BUG-001 to BUG-011) with reproduction steps, severity, and engineer notes
- [`strategy.md`](./strategy.md) — Test strategy, risk model, and prioritisation rationale
