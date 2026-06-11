/**
 * Soft-match assertion helpers for non-deterministic LLM output.
 *
 * The central testing challenge with an AI assistant is that the answer
 * text changes on every run. Asserting on exact strings would produce
 * a brittle suite that breaks whenever the model is updated.
 *
 * Instead, we assert on properties that must hold regardless of phrasing:
 *   • Which document IDs appear in `citations`  (structural, deterministic)
 *   • Whether specific keywords appear in `answer`  (semantic, stable)
 *   • Whether the answer looks like a refusal  (behavioural, stable)
 *
 * Citations are the most reliable signal. The citations array is populated
 * by the retrieval layer, not the language model, so it is far more
 * deterministic than the generated text.
 */

import { expect } from '@playwright/test';
import type { QueryResponse } from './fixtures';

const REFUSAL_PHRASES = [
  'i do not have',
  "i don't have",
  'no approved document',
  'cannot help',
  'not available',
  'please check with',
  "i'm unable",
  'i am unable',
];

// ─── Citation assertions ──────────────────────────────────────────────────────

/**
 * At least one of the required doc IDs must appear in citations.
 * We use "at least one" rather than "exactly these" because the retrieval
 * system may legitimately cite additional supporting documents.
 */
export function assertCitationsInclude(
  citations: string[],
  ...required: string[]
): void {
  const missing = required.filter((id) => !citations.includes(id));
  expect.soft(
    missing,
    `Expected citation(s) [${required.join(', ')}] — missing: [${missing.join(', ')}]. Got: [${citations.join(', ')}]`,
  ).toHaveLength(0);
}

/**
 * None of the forbidden doc IDs may appear in citations.
 * This is the primary assertion for lifecycle and access-control tests.
 */
export function assertCitationsExclude(
  citations: string[],
  ...forbidden: string[]
): void {
  const found = forbidden.filter((id) => citations.includes(id));
  expect.soft(
    found,
    `Forbidden citation(s) [${found.join(', ')}] appeared. Full citations: [${citations.join(', ')}]`,
  ).toHaveLength(0);
}

// ─── Answer keyword assertions ────────────────────────────────────────────────

/**
 * All supplied keywords must appear somewhere in the answer (case-insensitive).
 * Use sparingly — only for facts that are stable across model versions
 * (e.g. a specific numeric value like "75" or a currency code "USD").
 */
export function assertAnswerContains(answer: string, ...keywords: string[]): void {
  const lower = answer.toLowerCase();
  const missing = keywords.filter((kw) => !lower.includes(kw.toLowerCase()));
  expect.soft(
    missing,
    `Expected keyword(s) [${missing.join(', ')}] not found in answer: "${answer.substring(0, 200)}"`,
  ).toHaveLength(0);
}

/**
 * None of the forbidden keywords may appear in the answer.
 * Used in guardrail tests to confirm restricted content was not leaked
 * even when the doc ID is absent from citations.
 */
export function assertAnswerExcludes(answer: string, ...forbidden: string[]): void {
  const lower = answer.toLowerCase();
  const found = forbidden.filter((kw) => lower.includes(kw.toLowerCase()));
  expect.soft(
    found,
    `Forbidden keyword(s) [${found.join(', ')}] found in answer: "${answer.substring(0, 200)}"`,
  ).toHaveLength(0);
}

// ─── Refusal assertions ───────────────────────────────────────────────────────

/** Answer must be a refusal — the assistant has no approved content to share. */
export function assertRefusal(response: QueryResponse): void {
  const lower = response.answer.toLowerCase();
  const isRefusal = REFUSAL_PHRASES.some((phrase) => lower.includes(phrase));
  expect.soft(
    isRefusal,
    `Expected a refusal but got a substantive answer: "${response.answer.substring(0, 300)}"\nCitations: [${response.citations.join(', ')}]`,
  ).toBe(true);
}

/** Answer must NOT be a refusal — the assistant should have approved content. */
export function assertNotRefusal(response: QueryResponse): void {
  const lower = response.answer.toLowerCase();
  const isRefusal = REFUSAL_PHRASES.some((phrase) => lower.includes(phrase));
  expect.soft(
    isRefusal,
    `Expected a substantive answer but got a refusal: "${response.answer.substring(0, 300)}"`,
  ).toBe(false);
}

// ─── Golden-case runner ───────────────────────────────────────────────────────

/**
 * Apply all assertions from a golden dataset case to a live query response.
 * Used in citations.spec.ts to drive the full golden set in one pass.
 */
export function assertGoldenCase(
  response: QueryResponse,
  tc: {
    required_citations: string[];
    forbidden_citations: string[];
    required_keywords: string[];
    forbidden_keywords: string[];
    expect_refusal: boolean;
  },
): void {
  if (tc.required_citations.length > 0) {
    assertCitationsInclude(response.citations, ...tc.required_citations);
  }
  if (tc.forbidden_citations.length > 0) {
    assertCitationsExclude(response.citations, ...tc.forbidden_citations);
  }
  if (tc.required_keywords.length > 0) {
    assertAnswerContains(response.answer, ...tc.required_keywords);
  }
  if (tc.forbidden_keywords.length > 0) {
    assertAnswerExcludes(response.answer, ...tc.forbidden_keywords);
  }
  if (tc.expect_refusal) {
    assertRefusal(response);
  } else {
    assertNotRefusal(response);
  }
}
