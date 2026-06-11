import { test, expect } from '@playwright/test';
import { KnowledgeApiService } from '../../services/knowledge/knowledge.api.service';

/**
 * Header validation for POST /query and GET /documents.
 *
 * X-User-Region and X-User-Role are required headers with enumerated values.
 * Missing or invalid values must return HTTP 400.
 */

const QUESTION = 'What is my daily meal allowance?';

test.describe('POST /query — header validation', () => {
  test('missing X-User-Region returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).queryRaw(
      { 'X-User-Role': 'Employee' },
      QUESTION,
    );
    expect.soft(resp.status, 'Missing X-User-Region should be rejected').toBe(400);
  });

  test('missing X-User-Role returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).queryRaw(
      { 'X-User-Region': 'Americas' },
      QUESTION,
    );
    expect.soft(resp.status, 'Missing X-User-Role should be rejected').toBe(400);
  });

  test('missing both headers returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).queryRaw({}, QUESTION);
    expect.soft(resp.status, 'Missing both headers should be rejected').toBe(400);
  });

  test('invalid X-User-Region value returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).queryRaw(
      { 'X-User-Region': 'Mars', 'X-User-Role': 'Employee' },
      QUESTION,
    );
    expect.soft(resp.status, 'Invalid region "Mars" should be rejected').toBe(400);
  });

  test('invalid X-User-Role value returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).queryRaw(
      { 'X-User-Region': 'Americas', 'X-User-Role': 'Superhero' },
      QUESTION,
    );
    expect.soft(resp.status, 'Invalid role "Superhero" should be rejected').toBe(400);
  });
});

test.describe('GET /documents — header validation', () => {
  test('missing X-User-Region returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).documentsRaw(
      { 'X-User-Role': 'Employee' },
    );
    expect.soft(resp.status, 'Missing X-User-Region should be rejected').toBe(400);
  });

  test('missing X-User-Role returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).documentsRaw(
      { 'X-User-Region': 'Americas' },
    );
    expect.soft(resp.status, 'Missing X-User-Role should be rejected').toBe(400);
  });

  test('invalid X-User-Region value returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).documentsRaw(
      { 'X-User-Region': 'Mars', 'X-User-Role': 'Employee' },
    );
    expect.soft(resp.status, 'Invalid region "Mars" should be rejected').toBe(400);
  });

  test('invalid X-User-Role value returns 400', async ({ request, baseURL }) => {
    const resp = await new KnowledgeApiService(request, baseURL!).documentsRaw(
      { 'X-User-Region': 'Americas', 'X-User-Role': 'Superhero' },
    );
    expect.soft(resp.status, 'Invalid role "Superhero" should be rejected').toBe(400);
  });
});
