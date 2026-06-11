import { test, expect } from '@playwright/test';
import { KnowledgeApiService } from '../../services/knowledge/knowledge.api.service';
import { type DocumentDto, LifecycleState, Region } from '../../services/knowledge/dto/document.dto';
import { Role } from '../../services/knowledge/dto/query.dto';
import { ALLOWED_AUDIENCES, ALLOWED_REGIONS, FORBIDDEN_DOC_IDS } from '../../services/knowledge/dto/access-rules';



for (const region of Object.values(Region)) {
  for (const role of Object.values(Role)) {
    test.describe(`GET /documents — ${region}/${role}`, () => {
      let api: KnowledgeApiService;
      let docs: Awaited<ReturnType<KnowledgeApiService['documents']>>['data'];

      test.beforeAll(async ({ request, baseURL }) => {
        api = new KnowledgeApiService(request, baseURL!);
        const resp = await api.documents(region, role);
        docs = resp.data;
      });

      test('returns HTTP 200', async ({ request, baseURL }) => {
        const resp = await new KnowledgeApiService(request, baseURL!).documents(region, role);
        expect.soft(resp.status).toBe(200);
      });

      test('excludes forbidden lifecycle states (Draft, In Review, Retired)', () => {
        const leaked = docs
          .filter((d) => FORBIDDEN_DOC_IDS.has(d.doc_id))
          .map((d) => `${d.doc_id}(${d.state})`);
        expect.soft(leaked, `Forbidden documents leaked: ${leaked.join(', ')}`).toHaveLength(0);
      });

      test('every returned document is Approved', () => {
        const nonApproved = docs
          .filter((d) => d.state !== LifecycleState.Approved)
          .map((d) => `${d.doc_id}(${d.state})`);
        expect.soft(nonApproved, `Non-approved docs returned: ${nonApproved.join(', ')}`).toHaveLength(0);
      });

      test('region scoping: no out-of-region documents', () => {
        const allowed = ALLOWED_REGIONS[region];
        const outOfRegion = docs
          .filter((d) => !allowed.has(d.region))
          .map((d) => `${d.doc_id}(region=${d.region})`);
        expect.soft(outOfRegion, `Out-of-region docs returned: ${outOfRegion.join(', ')}`).toHaveLength(0);
      });

      test('role scoping: no out-of-role documents', () => {
        const allowed = ALLOWED_AUDIENCES[role];
        const outOfRole = docs
          .filter((d) => !allowed.has(d.audience))
          .map((d) => `${d.doc_id}(audience=${d.audience})`);
        expect.soft(outOfRole, `Out-of-role docs returned: ${outOfRole.join(', ')}`).toHaveLength(0);
      });
    });
  }
}

// ─── Positive presence checks ─────────────────────────────────────────────────
// The matrix above asserts what must NOT appear. These tests assert that
// expected documents DO appear for authorised users — catching the inverse
// failure where the endpoint under-returns and omits accessible documents.

test.describe('Document presence — expected docs appear for authorised users', () => {
  function docIds(docs: DocumentDto[]): Set<string> {
    return new Set(docs.map((d) => d.doc_id));
  }

  test('[documents] D-001 and D-004 present for Americas/Employee', async ({ request, baseURL }) => {
    const { data: docs } = await new KnowledgeApiService(request, baseURL!).documents(
      Region.Americas,
      Role.Employee,
    );
    const ids = docIds(docs);
    expect.soft(ids.has('D-001'), 'D-001 missing from Americas/Employee list').toBe(true);
    expect.soft(ids.has('D-004'), 'D-004 missing from Americas/Employee list').toBe(true);
  });

  test('[documents] D-002 and D-004 present for EMEA/Employee', async ({ request, baseURL }) => {
    const { data: docs } = await new KnowledgeApiService(request, baseURL!).documents(
      Region.EMEA,
      Role.Employee,
    );
    const ids = docIds(docs);
    expect.soft(ids.has('D-002'), 'D-002 missing from EMEA/Employee list').toBe(true);
    expect.soft(ids.has('D-004'), 'D-004 missing from EMEA/Employee list').toBe(true);
  });

  test('[documents] D-006 and D-004 present for Americas/Engineering', async ({ request, baseURL }) => {
    const { data: docs } = await new KnowledgeApiService(request, baseURL!).documents(
      Region.Americas,
      Role.Engineering,
    );
    const ids = docIds(docs);
    expect.soft(ids.has('D-006'), 'D-006 missing from Americas/Engineering list').toBe(true);
    expect.soft(ids.has('D-004'), 'D-004 missing from Americas/Engineering list').toBe(true);
  });

  test('[documents] D-008 and D-004 present for APAC/Finance', async ({ request, baseURL }) => {
    const { data: docs } = await new KnowledgeApiService(request, baseURL!).documents(
      Region.APAC,
      Role.Finance,
    );
    const ids = docIds(docs);
    expect.soft(ids.has('D-008'), 'D-008 missing from APAC/Finance list').toBe(true);
    expect.soft(ids.has('D-004'), 'D-004 missing from APAC/Finance list').toBe(true);
  });

  test('[documents] D-007 and D-004 present for EMEA/Manager', async ({ request, baseURL }) => {
    const { data: docs } = await new KnowledgeApiService(request, baseURL!).documents(
      Region.EMEA,
      Role.Manager,
    );
    const ids = docIds(docs);
    expect.soft(ids.has('D-007'), 'D-007 missing from EMEA/Manager list').toBe(true);
    expect.soft(ids.has('D-004'), 'D-004 missing from EMEA/Manager list').toBe(true);
  });
});
