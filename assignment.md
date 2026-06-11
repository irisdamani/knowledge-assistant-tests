# QA Engineer Take-Home Assignment

*Newpage Solutions*

## About this assignment

We give you a small running **Knowledge Assistant**: a one-page app with an API, standing in for an internal RAG assistant that answers employee questions from a library of company documents and cites its sources. Access is scoped by **region** and **role**, and documents carry lifecycle states (Draft, In Review, Approved, Retired) that govern what is allowed to surface. Your job is to test it, and to leave behind an automated suite that keeps it tested.

Testing a product like this is not like testing deterministic software. The failures that matter most do not throw exceptions: a hallucinated claim, a citation pointing to the wrong document, or content surfacing for someone who shouldn't see it. We care as much about *how* you reason as *what* you find. A tight, well-argued strategy with a few deep findings and a clean automated suite tells us more than an exhaustive but shallow matrix.

> The assistant's behaviour is simulated deterministically for this exercise (no model, no API key). Treat it as a stand-in for a real RAG assistant.

## What you get

- **The app**, hosted at **https://main-knowledge-assistant.newpage.workers.dev/**. A single page where you pick a region and a role, ask questions, and get answers with citations, alongside a panel of documents visible to you. It is backed by a small JSON API on the same host (`POST /query`, `GET /documents`), with the machine-readable spec at `/openapi.json` and interactive API docs at `/docs`. The API takes the user's context as the `X-User-Region` (Americas, EMEA, APAC) and `X-User-Role` (Employee, Engineering, Finance, Manager) headers. The UI exposes stable `data-testid` hooks for browser automation. You interact with the assistant through the UI and API; treat its internals as a black box, as you would a real model.
- **A product spec** (`product-spec.md`): what the assistant is meant to do, the access and lifecycle rules that define correct behaviour, and a few example questions to get you started.
- **The source content** (`content-library.md`) and a **data export** (`data-export.csv`): the documents the assistant draws from, plus a tabular inventory of their region, audience, and lifecycle state. Use these, with the spec, to design your tests and to check what the app returns against ground truth.

You design your test cases from the spec and the content. The spec tells you how the assistant *should* behave; it does not tell you where it falls short. Finding that is the job.

## Your task

Everything below is tested against this one system.

**1. Test strategy and prioritisation.** Using the spec and the document inventory, sketch how you'd approach testing this assistant. The space is combinatorial (regions, roles, lifecycle states, question types, and the ways an AI assistant can misbehave), and you cannot cover all of it. Tell us where you'd start and why, where the risk is concentrated, and what you'd consciously choose *not* to test. We want your prioritisation logic, not a giant matrix. Aim for roughly one page.

**2. Explore and report defects.** Work through the UI and the API and find the problems. Look for the things AI products specifically get wrong: hallucinated or unsupported claims; citations that point to the wrong source; content surfacing where the rules forbid it (In-Review, Draft, or Retired content); access that crosses a region or role boundary; prompt-injection or guardrail weaknesses. A useful habit: compare what the UI shows a given user against what the API returns directly, and cross-check both against the content and the data export. File each finding as a clear, reproducible, ranked defect, with enough investigation that an engineer has a real starting point.

**3. Automated regression suite (the centrepiece).** Build an automated suite that keeps this assistant honest, running at both layers.

- Start from a **golden-question suite**: the set of questions and the pass criteria that define correct behaviour, written so they stay meaningful after the underlying model is swapped, a prompt is changed, or the retrieval index is rebuilt. This dataset is the backbone of your suite, so cover more than the happy path: refusals, lifecycle exclusion, access boundaries, citation correctness, and adversarial inputs.
- Implement it as automated tests at both layers:
  - **API layer** (pytest with requests, Postman/Newman, REST Assured, or similar): the access and lifecycle rules across the full region and role matrix, citation correctness, and the documents endpoint. Drive these data-driven from your golden set rather than copy-pasting near-identical cases.
  - **UI layer** (Playwright, Cypress, or equivalent): the genuinely UI-specific behaviour, such as answers and citations rendering and the documents panel scoping correctly to the user. The UI exposes stable `data-testid` hooks.

We will look closely at how the suite is engineered: structure and naming, how you parametrise across the matrix, fixtures and setup/teardown, how you assert on non-deterministic output without brittle exact-string matching, how maintainable it is, and how to run it (CI-ready is a plus). Tell us what you chose to test at each layer and why; a strong suite verifies each rule at the cheapest layer that gives confidence and does not push a slow UI test to do an API check's job.

**4. Reflection (in your own words, not an LLM's).** Where does AI/LLM evaluation tooling genuinely help for a system like this, and where does it fall short? Which of your checks would you trust to survive a model swap, and which would you expect to break? How do you keep an automated suite maintainable and repeatable when you use AI coding assistants to write test code, and what are your do's and don'ts? What would you add with more time?

## What we're looking for

- **Automation engineering:** a well-structured, data-driven, maintainable suite across both layers, not a handful of ad hoc scripts.
- **Layered design:** each rule verified at the cheapest layer that gives confidence.
- **Robust assertions:** coverage that survives a model swap, a prompt change, or a new index.
- **AI-failure-mode literacy:** you know how these systems break (hallucination, citation drift, content and role leakage, guardrail bypass) and you test for it.
- **Risk-based judgement:** a focused strategy that triages a space you can't fully cover.
- **Actionable defects:** reports an engineer can act on without scheduling a meeting.
- **Clear-eyed about tooling:** you know where AI eval tools help and where they don't.

## Going further (optional)

The tasks above focus on functional correctness. If you want to show more, we will be impressed by coverage of what matters for a system like this beyond whether each answer is right: performance and behaviour under load, detecting model or output drift over time (answers shifting after a model, prompt, or index change), observability, or automated eval scoring of grounding and hallucination with tools such as Ragas, Promptfoo, or DeepEval. Treat these as extra credit rather than requirements, and only once the core is solid.

## A few notes

- **Acknowledge what you skipped.** If you would test something but didn't get to it, say so. Naming the gap is itself a signal.
- **Submit** a repo with your runnable automated suite (API and UI), pointed at the hosted URL, with clear run instructions, plus your strategy, your defect reports, and your reflection.
- **Questions?** Reach out to your point of contact at Newpage (e.g. shilpa.shetty@newpage.io).
