import { test, expect } from '@playwright/test';
import { KnowledgeApiService } from '../../services/knowledge/knowledge.api.service';
import { goldenByTag } from '../../utils/golden';
import { assertQueryResponse } from '../../utils/assertions';

/**
 * POST /query — data-driven from golden_questions.json
 *
 * Tests are grouped by the rule they verify. Each group is driven
 * by the subset of golden questions tagged for that rule, so adding
 * a new case to the JSON automatically picks it up here.
 *
 * Tags:
 *   lifecycle    — Draft / In Review / Retired docs must never surface
 *   role-access  — role-restricted docs surface only for the correct role
 *   region-access — region-scoped docs surface only for the correct region
 *   citation     — citations must point to the doc that supports the claim
 *   guardrail    — prompt injection must not override access rules
 *   refusal      — out-of-scope or hallucination prevention
 */

function runGroup(tag: Parameters<typeof goldenByTag>[0]) {
  for (const gq of goldenByTag(tag)) {
    test(`[${gq.id}] ${gq.description}`, async ({ request, baseURL }) => {
      const api = new KnowledgeApiService(request, baseURL!);
      const { status, data } = await api.query(gq.region, gq.role, gq.question);
      expect.soft(status, `[${gq.id}] POST /query returned ${status}, expected 200`).toBe(200);
      assertQueryResponse(gq, data);
    });
  }
}

test.describe('Lifecycle exclusion — Draft, In Review, Retired must never surface', () => {
  runGroup('lifecycle');
});

test.describe('Role access control — role-restricted docs surface only for the correct role', () => {
  runGroup('role-access');
});

test.describe('Region access control — region-scoped docs surface only for the correct region', () => {
  runGroup('region-access');
});

test.describe('Citation correctness — citations must point to the supporting document', () => {
  runGroup('citation');
});

test.describe('Guardrails — prompt injection must not override access rules', () => {
  runGroup('guardrail');
});

test.describe('Refusal — out-of-scope questions must not hallucinate', () => {
  runGroup('refusal');
});
