# Test Strategy and Prioritisation
## Knowledge Assistant QA Take-Home Assignment

## Approach

I would approach testing this Knowledge Assistant as a risk-based RAG validation exercise rather than a traditional QA effort. As a QA Automation Engineer, my first instinct is to identify where a failure would have the biggest impact and then validate that risk at the cheapest layer possible.

Here, the biggest risk is not that the application crashes. It is that it confidently returns information that is incorrect, outdated, unsupported, or not intended for the user — and does so with a clean HTTP 200 that looks like success. These are the failures that are hardest to detect, hardest to reproduce without deliberate probing, and most damaging when they reach a real user.

Given the combination of regions, roles, document states, question types, and AI-specific failure modes, exhaustive coverage is neither practical nor valuable. Instead, I prioritise the areas where a failure would have the greatest impact on trust, compliance, and data access.

## Document Inventory

Before designing tests, I reviewed the document inventory to understand where the constraints are concentrated. The library contains nine documents. Three are non-approved (Draft, In Review, Retired) and four are restricted by role. This creates a small but dense constraint space where lifecycle filtering and access control become the highest-risk areas.

## Where I Would Start and Why

I would start with lifecycle filtering. Not because it is first in the specification, but because it is the rule where a failure is most harmful and least visible. An employee reads a Retired policy and acts on it. Someone receives In Review guidance that was never approved. The system returns HTTP 200 either way — confident, clean, and with no indication that anything is wrong.

The first documents I would focus on are D-003 (In Review), D-005 (Retired), and D-009 (Draft). These are realistic failure candidates because they contain relevant content that a retrieval system could easily surface if filtering is not working correctly.

From a testing perspective, I would start at the API layer and then cross-check behaviour through the UI. The API gives me fast coverage across all region and role combinations, while the UI confirms what users actually see. Differences between the two layers can expose important defects that would be missed by testing only one.

Once lifecycle filtering is validated, I would move to role and region access control, followed by citation accuracy and grounding.

## Where the Risk is Concentrated

- **Lifecycle enforcement:** Draft, In Review, and Retired documents must never appear in answers or citations. A single leak can expose outdated or unapproved information.
- **Role and region access control:** Users should only receive content they are authorised to access. The main risks are cross-role and cross-region information leakage.
- **Citation accuracy and grounding:** Answers should be supported by the correct source documents. A correct answer with the wrong citation is still a defect.
- **Retrieval false negatives:** A RAG system can fail not only by exposing information it should not return, but also by failing to retrieve approved content that users should have access to. Both outcomes reduce trust and can push users toward unofficial sources.
- **Cross-layer consistency:** Differences between what the API exposes and what the UI displays can create security, compliance, and trust issues even when each layer appears to work correctly in isolation.
- **Guardrail robustness:** The assistant should consistently resist prompt-injection attempts and refuse requests that try to bypass access or lifecycle restrictions.

## What I Would Consciously Choose Not to Test

- **Phrasing and synonym variation:** I would not test every possible wording of the same question. The goal is to validate the rule, not every way a user might express it.
- **Exact answer wording:** I care about behaviour, not phrasing. Assertions should focus on facts, citations, and refusal behaviour rather than exact text.
- **Repeating the full access-control matrix in the UI:** These rules are faster and more reliably validated through the API. UI tests should focus on user-facing behaviour.
- **Performance, load, and concurrency:** For this exercise, correctness is significantly more important than performance.
- **Exhaustive prompt-injection testing:** I would include representative attacks to validate guardrails, but not attempt a full red-team exercise.
- **UI styling, browser compatibility, and accessibility:** These are important for production readiness but carry lower risk than content correctness and access control for this system.
- **Retrieval false negatives — exhaustive phrasing only:** I would test for false negatives, but I would not chase every phrasing variation trying to map exactly where retrieval breaks down.

## Layering Strategy

As a QA Automation engineer, I always want to validate each rule at the cheapest layer that provides real confidence.

**API Layer:**
- Access control
- Lifecycle filtering
- Citation validation
- Grounding checks
- Refusal behaviour
- Prompt-injection scenarios
- Document visibility rules

**UI Layer:**
- Region and role selection
- Question submission
- Answer rendering
- Citation display
- Refusal message presentation
- Document panel scoping

This approach keeps the suite fast, maintainable, and focused on the highest-risk behaviours while remaining resilient to future model, prompt, or retrieval changes.
