

import { test, expect } from './fixtures';

test('[ui] page loads — title and key controls visible', async ({ app, page }) => {
  await expect(page).toHaveTitle(/knowledge assistant/i);
  await expect(app.regionSelect).toBeVisible();
  await expect(app.roleSelect).toBeVisible();
  await expect(app.questionInput).toBeVisible();
  await expect(app.askButton).toBeVisible();
  await expect(app.docsPanel).toBeVisible();
});

test('[ui] default state — Americas/Employee selected on load', async ({ app }) => {
  await expect(app.regionSelect).toHaveValue('Americas');
  await expect(app.roleSelect).toHaveValue('Employee');
});

// ─── 2. Document panel — renders correct docs per region/role ─────────────────

test('[ui][doc-panel] Americas/Employee — D-001 and D-004 visible, no restricted docs',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await expect(app.docsPanel).toContainText('D-001');

    const ids = await app.getDocIds();
    expect(ids).toContain('D-001');
    expect(ids).toContain('D-004');

    // Restricted docs must not appear in the panel
    expect(ids).not.toContain('D-003');
    expect(ids).not.toContain('D-005');
    expect(ids).not.toContain('D-006'); // Engineering only
    expect(ids).not.toContain('D-007'); // Manager only
    expect(ids).not.toContain('D-008'); // Finance only
    expect(ids).not.toContain('D-009');
  }
);

test('[ui][doc-panel] switching to EMEA — D-002 appears, D-001 disappears',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await expect(app.docsPanel).toContainText('D-001');

    // Confirm Americas state
    let ids = await app.getDocIds();
    expect(ids).toContain('D-001');

    // Switch to EMEA — wait for panel to re-render before reading
    await app.setRegion('EMEA');
    await expect(app.docsPanel).toContainText('D-002');
    ids = await app.getDocIds();
    expect(ids).toContain('D-002');
    expect(ids).not.toContain('D-001');
  }
);

test('[ui][doc-panel] Engineering role — D-006 appears, D-007/D-008 absent',
  async ({ app }) => {
    await app.setUser('Americas', 'Engineering');
    await expect(app.docsPanel).toContainText('D-006');

    const ids = await app.getDocIds();
    expect(ids).toContain('D-006');
    expect(ids).not.toContain('D-007');
    expect(ids).not.toContain('D-008');
  }
);

test('[ui][doc-panel] Manager role — D-007 appears, D-006/D-008 absent',
  async ({ app }) => {
    await app.setUser('Americas', 'Manager');
    await expect(app.docsPanel).toContainText('D-007');

    const ids = await app.getDocIds();
    expect(ids).toContain('D-007');
    expect(ids).not.toContain('D-006');
    expect(ids).not.toContain('D-008');
  }
);

test('[ui][doc-panel] Finance role — D-008 appears, D-006/D-007 absent',
  async ({ app }) => {
    await app.setUser('Americas', 'Finance');
    await expect(app.docsPanel).toContainText('D-008');

    const ids = await app.getDocIds();
    expect(ids).toContain('D-008');
    expect(ids).not.toContain('D-006');
    expect(ids).not.toContain('D-007');
  }
);

// ─── 3. Document panel — forbidden state labels never appear ──────────────────

/**
 * This test is UI-specific. The API test in documents.spec.ts verifies the
 * /documents response contains no forbidden states. This test verifies the
 * rendered panel label never displays "In Review", "Retired", or "Draft".
 * These are two different failure modes:
 *  - API returns bad data → caught by documents.spec.ts
 *  - API returns good data but UI renders wrong label → caught here
 */
const FORBIDDEN_STATE_LABELS = ['In Review', 'Retired', 'Draft'];

const PANEL_COMBOS = [
  { region: 'Americas', role: 'Employee' },
  { region: 'EMEA',     role: 'Employee' },
  { region: 'APAC',     role: 'Employee' },
  { region: 'Americas', role: 'Manager' },
  { region: 'Americas', role: 'Engineering' },
  { region: 'Americas', role: 'Finance' },
];

for (const { region, role } of PANEL_COMBOS) {
  test(`[ui][doc-panel][lifecycle] no forbidden state label — ${region}/${role}`,
    async ({ app }) => {
      await app.setUser(region, role);

      const states = await app.getDocStates();
      for (const state of states) {
        expect(
          FORBIDDEN_STATE_LABELS.includes(state),
          `Forbidden state label "${state}" appeared in document panel for ${region}/${role}`
        ).toBe(false);
      }
    }
  );
}

// ─── 4. Ask flow — interaction contract ───────────────────────────────────────

test('[ui][ask] submitting a question renders an answer',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await app.ask('What is my daily meal allowance when I travel?');

    const answer = await app.getAnswer();
    expect(answer.trim().length).toBeGreaterThan(0);
  }
);

test('[ui][ask] citation chip appears and matches a known doc ID',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await app.ask('What is my daily meal allowance when I travel?');

    const chips = await app.getCitationChipIds();
    expect(chips.length, 'At least one citation chip must appear').toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip).toMatch(/^D-\d{3}$/);
    }
  }
);

test('[ui][ask] citation chip matches document in the panel',
  async ({ app }) => {

    await app.setUser('Americas', 'Employee');
    await app.ask('What is my daily meal allowance when I travel?');

    const chips = await app.getCitationChipIds();
    const docIds = await app.getDocIds();

    for (const chip of chips) {
      expect(
        docIds,
        `Citation chip "${chip}" references a doc not in the visible panel`
      ).toContain(chip);
    }
  }
);

test('[ui][ask] asking a second question replaces the previous answer',
  async ({ app }) => {
    /**
     * State management: after a second submission, the UI must not show
     * the previous answer alongside the new one. Each question should
     * produce exactly one answer block.
     */
    await app.setUser('Americas', 'Employee');

    await app.ask('What is my daily meal allowance when I travel?');
    const firstAnswer = await app.getAnswer();

    await app.ask('What is the company holiday schedule?');
    const secondAnswer = await app.getAnswer();

    expect(secondAnswer).not.toEqual(firstAnswer);
    await expect(app.answerPanel).toHaveCount(1);
  }
);

test('[ui][ask] question input can be cleared and reused after a response',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await app.ask('What is my daily meal allowance when I travel?');

    await expect(app.questionInput).toBeEditable();
    await app.questionInput.fill('New question');
    await expect(app.questionInput).toHaveValue('New question');
  }
);

// ─── 5. Role/region switch — panel updates without reload ─────────────────────

test('[ui][doc-panel] switching role updates panel without page reload',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');
    await expect(app.docsPanel).toContainText('D-001');

    const beforeIds = await app.getDocIds();
    expect(beforeIds).not.toContain('D-007');

    await app.setRole('Manager');
    await expect(app.docsPanel).toContainText('D-007');

    const afterIds = await app.getDocIds();
    expect(afterIds).toContain('D-007');
    expect(afterIds).not.toContain('D-006');
    expect(afterIds).not.toContain('D-008');
  }
);

test('[ui][doc-panel] switching region updates panel without page reload',
  async ({ app }) => {
    await app.setUser('Americas', 'Employee');

    await app.setRegion('EMEA');
    await expect(app.docsPanel).toContainText('D-002');

    const ids = await app.getDocIds();
    expect(ids).toContain('D-002');
    expect(ids).not.toContain('D-001');
  }
);

// ─── 6. Citation chip — forbidden docs never rendered ─────────────────────────

test('[ui][citation] D-005 (Retired) citation chip is never rendered for a remote-work answer',
  async ({ app }) => {
    /**
     * This is the UI face of BUG-002.
     * The API test verifies D-005 appears in the citations array.
     * This test verifies the citation chip is actually rendered in the UI.
     * If the API bug is fixed but the chip rendering is wrong (or vice versa),
     * one of the two tests catches it.
     */
    await app.setUser('Americas', 'Employee');
    await app.ask('How many days a week can I work remotely?');

    const chips = await app.getCitationChipIds();
    expect(chips, 'D-005 (Retired) citation chip must never be rendered').not.toContain('D-005');
  }
);

test('[ui][citation] D-003 (In Review) citation chip is never rendered',
  async ({ app }) => {
    await app.setUser('APAC', 'Employee');
    await app.ask('What is my daily meal allowance when I travel?');

    const chips = await app.getCitationChipIds();
    expect(chips, 'D-003 (In Review) citation chip must never be rendered').not.toContain('D-003');
  }
);

test('[ui][citation] role-restricted doc chip not shown to wrong role',
  async ({ app }) => {
    /**
     * An Employee should never see a D-007 citation chip.
     * This is the UI-rendered version of the access-control test in golden.spec.ts.
     */
    await app.setUser('Americas', 'Employee');
    await app.ask('What is the manager discretionary budget for compensation review?');

    const chips = await app.getCitationChipIds();
    expect(chips, 'D-007 citation chip must not be rendered for Employee role').not.toContain('D-007');
  }
);
