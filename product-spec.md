# Knowledge Assistant: Product Specification

## Overview

The Knowledge Assistant answers employee questions in natural language using the company's library of internal documents, and cites the documents it used. You interact with it through the UI and the API. Treat its internals as a black box, as you would a real model: design your tests from this spec and the document inventory, not from its source.

## What it covers

The assistant answers questions about the company's internal policies and procedures. The topics available are exactly those in the document library: see `content-library.md` for the source documents and `data-export.csv` for the inventory (travel and expense, remote work, procurement, data handling, compensation review, vendor onboarding, and so on), along with each document's region, audience, and lifecycle state.

## Users

Every request carries the user's region and role.

- Region: one of Americas, EMEA, APAC.
- Role: one of Employee, Engineering, Finance, Manager.

In the UI these are the two selectors. Over the API they are the `X-User-Region` and `X-User-Role` headers.

## How it should behave

1. **Access by region and role.** A document may be used in an answer (and cited) only if its region is Global or the user's region, and its audience is All Staff or the user's role.
2. **Lifecycle.** Only Approved documents may surface. Draft, In Review, and Retired documents must never appear in an answer or its citations, even to a user who could otherwise see an approved version.
3. **Grounding.** Every factual claim should be supported by a cited document, and citations must point to the document that actually supports the claim.
4. **Refusal.** If no approved, in-scope document covers the question, the assistant should say it does not have that information rather than guess.
5. **Guardrails.** The assistant must not follow instructions that try to override these rules, such as requests to reveal draft, in-review, retired, or out-of-scope content.

> A few details are intentionally left open, for example whether a travel question is scoped to the traveller's home region or the destination, and how a user with more than one role should be treated. Deciding how you would pin these down as testable rules is part of the exercise.

## Example questions

These show the kind of thing the assistant handles. They are not a checklist, and several will behave correctly. Try them under different regions and roles, and design many more of your own.

- What is my daily meal allowance when I travel?
- How many days a week can I work remotely?
- What are the procurement approval thresholds?
- How should production data be handled?

Designing thorough coverage across regions, roles, lifecycle states, question types, and adversarial inputs is the task.
