import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Knowledge Assistant — single-page app at the root URL.
 *
 * The panel sidebar and answer area are populated client-side after each
 * dropdown change or question submission. Locators use data-testid attributes
 * so tests are decoupled from markup and CSS changes.
 *
 * citesPanel is private — it exists only to scope citationChips.
 * All other locators are exposed for direct use in tests and fixtures.
 */
export class AssistantPage extends BasePage {
    private static readonly URL = '/';

    readonly regionSelect: Locator;
    readonly roleSelect: Locator;
    readonly questionInput: Locator;
    readonly askButton: Locator;
    readonly answerPanel: Locator;
    private readonly citesPanel: Locator;
    readonly citationChips: Locator;
    readonly docsPanel: Locator;
    readonly docEntries: Locator;

    constructor(page: Page) {
        super(page);

        this.regionSelect   = page.getByTestId('region');
        this.roleSelect     = page.getByTestId('role');

        this.questionInput  = page.getByTestId('question');
        this.askButton      = page.getByTestId('ask');
        this.answerPanel    = page.getByTestId('answer');

        this.citesPanel     = page.getByTestId('cites');
        this.citationChips  = this.citesPanel.getByTestId('citation');

        this.docsPanel      = page.getByTestId('docs');
        this.docEntries     = this.docsPanel.getByTestId('doc');
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    async goto(): Promise<void> {
        await this.navigate(AssistantPage.URL);
        // Wait for the initial document panel to populate before the test reads it
        await expect(this.docsPanel).not.toBeEmpty({ timeout: 10_000 });
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    async setRegion(region: string): Promise<void> {
        await this.regionSelect.selectOption(region);
    }

    async setRole(role: string): Promise<void> {
        await this.roleSelect.selectOption(role);
    }

    /** Convenience wrapper: set both dropdowns in one call. */
    async setUser(region: string, role: string): Promise<void> {
        await this.setRegion(region);
        await this.setRole(role);
    }

    /**
     * Fill the question input, click Ask, and wait for a real answer to appear.
     *
     * The UI transitions through two states after a click:
     *   1. "Answers will appear here." → "Thinking..." (request in-flight)
     *   2. "Thinking..." → actual answer text
     *
     * Waiting only for `not.toBeEmpty()` resolves at step 1, returning
     * "Thinking..." to callers. Instead we wait for both intermediate texts
     * to be absent, which guarantees the real answer is shown.
     */
    async ask(question: string): Promise<void> {
        await this.questionInput.fill(question);
        await this.askButton.click();
        await expect(this.answerPanel).not.toContainText('Answers will appear here.', { timeout: 5_000 });
        await expect(this.answerPanel).not.toContainText('Thinking...', { timeout: 30_000 });
    }

    // ── Data extraction ──────────────────────────────────────────────────────

    /** Returns the current answer panel text. */
    async getAnswer(): Promise<string> {
        return (await this.answerPanel.textContent()) ?? '';
    }

    /**
     * Returns the doc IDs currently rendered in the documents panel.
     * Parses the text content of each doc entry (e.g. "…D-001 · Approved")
     * rather than relying on a data attribute, making it resilient to markup
     * changes while the data-testid contract holds.
     */
    async getDocIds(): Promise<string[]> {
        const entries = await this.docEntries.all();
        const ids: string[] = [];
        for (const entry of entries) {
            const text = await entry.textContent() ?? '';
            const match = text.match(/D-\d{3}/);
            if (match) ids.push(match[0]);
        }
        return ids;
    }

    /**
     * Returns the lifecycle state labels rendered in the documents panel.
     * Each entry renders "D-001 · Approved"; this extracts the part after "·".
     * Used to assert that forbidden states (Draft, In Review, Retired) never
     * appear as visible labels, independent of what the API returned.
     */
    async getDocStates(): Promise<string[]> {
        const entries = await this.docEntries.all();
        const states: string[] = [];
        for (const entry of entries) {
            const text = await entry.textContent() ?? '';
            const match = text.match(/·\s*(.+)/);
            if (match) states.push(match[1].trim());
        }
        return states;
    }

    /**
     * Returns the doc IDs shown in the citation chips below the answer.
     * Each chip contains a raw doc ID string (e.g. "D-001").
     */
    async getCitationChipIds(): Promise<string[]> {
        const chips = await this.citationChips.all();
        const ids: string[] = [];
        for (const chip of chips) {
            ids.push((await chip.textContent() ?? '').trim());
        }
        return ids;
    }
}
