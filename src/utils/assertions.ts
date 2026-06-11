import {
  assertCitationsInclude,
  assertCitationsExclude,
  assertAnswerContains,
  assertAnswerExcludes,
  assertRefusal,
  assertNotRefusal,
} from './assertion';
import type { QueryResponse } from './fixtures';

export type GoldenTag = 'lifecycle' | 'role-access' | 'region-access' | 'citation' | 'guardrail' | 'refusal';

export interface GoldenQuestion {
  id: string;
  description: string;
  tags: GoldenTag[];
  region: string;
  role: string;
  question: string;
  expect_citations: string[];
  expect_citations_exclude: string[];
  answer_must_contain: string[];
  answer_must_contain_any: string[];
  answer_must_not_contain: string[];
  semantic_expectation: string;
  expect_refusal: boolean;
}

/**
 * Re-export isRefusal so callers don't need to import from two files.
 * Derived from the same REFUSAL_PHRASES used in assertion.ts.
 */
export { assertRefusal as isRefusalAssertion };

export function isRefusal(answer: string): boolean {
  try {
    assertRefusal({ answer, citations: [] } as QueryResponse);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run all assertions for a golden question against a live query response.
 * Delegates to the low-level primitives in assertion.ts.
 */
export function assertQueryResponse(gq: GoldenQuestion, body: QueryResponse): void {
  const ctx = `[${gq.id}] ${gq.region}/${gq.role} — "${gq.question}"\nRule: ${gq.semantic_expectation}`;

  if (gq.expect_refusal) {
    try {
      assertRefusal(body);
    } catch {
      throw new Error(`${ctx}\n${String(new Error('Expected a refusal'))}`);
    }
    assertCitationsExclude(body.citations);
    return;
  }

  if (gq.expect_citations.length > 0) {
    assertCitationsInclude(body.citations, ...gq.expect_citations);
  }
  if (gq.expect_citations_exclude.length > 0) {
    assertCitationsExclude(body.citations, ...gq.expect_citations_exclude);
  }
  if (gq.answer_must_contain.length > 0) {
    assertAnswerContains(body.answer, ...gq.answer_must_contain);
  }
  if (gq.answer_must_contain_any.length > 0) {
    // OR logic: at least one term must appear — not covered by assertAnswerContains (AND)
    const lower = body.answer.toLowerCase();
    const matched = gq.answer_must_contain_any.some((t) => lower.includes(t.toLowerCase()));
    if (!matched) {
      throw new Error(
        `${ctx}\nAnswer must contain at least one of [${gq.answer_must_contain_any.join(' | ')}]\nActual: "${body.answer}"`,
      );
    }
  }
  if (gq.answer_must_not_contain.length > 0) {
    assertAnswerExcludes(body.answer, ...gq.answer_must_not_contain);
  }

  assertNotRefusal(body);
}
