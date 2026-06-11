# Reflection

## Where AI/LLM Evaluation Tooling Helps — and Where It Doesn't

The biggest lesson from this exercise is that AI evaluation tooling solves a different problem than traditional QA.

Tools like Ragas, DeepEval, and Promptfoo are useful for evaluating answer quality, groundedness, hallucinations, and answer drift over time. They help answer questions such as:

* Is the response supported by the retrieved documents?
* Does the answer introduce facts that are not present in the source?
* Is the citation relevant to the answer?
* Has answer quality changed after a model or prompt update?

These are genuinely difficult problems to solve with traditional assertions.

Where these tools fall short is around structural and deterministic rules. Lifecycle filtering, access control, document visibility, API validation, and role restrictions are all binary outcomes. A Draft document either appeared or it did not. A Manager-only document was either exposed to an Employee or it was not. These checks are better validated through direct assertions rather than LLM-based evaluation.

For this reason, I view AI evaluation tooling as complementary rather than foundational. I would use eval tooling to validate *what was said*, but rely on deterministic assertions to validate *what was retrieved and who was allowed to see it*.

## Which Checks Would Survive a Model Swap?

The checks I would trust most after a model swap are the ones based on behaviour rather than wording.

These include:

* Expected citations present
* Forbidden citations absent
* Document visibility rules
* Role and region access control
* Lifecycle filtering
* HTTP response validation
* Expected refusal vs non-refusal behaviour

These checks validate the retrieval and access-control layers and should remain stable even if the underlying model changes.

The checks I would expect to be more fragile are:

* Exact answer wording
* Refusal phrasing
* Tone and style assertions
* Prompt-injection outcomes tied to specific prompt wording
* Keyword-based answer matching

A new model may answer correctly while using completely different language. For that reason, I avoid exact-string assertions wherever possible and focus on facts, citations, and access rules instead.

## Using AI Coding Assistants Responsibly

I used AI assistance throughout this exercise and found it most valuable for accelerating repetitive engineering work.

It is very effective for:

* Boilerplate code
* Test scaffolding
* Data-driven test structures
* Fixtures and page objects
* Repetitive API and UI test generation

Where I am much more cautious is around assertions and expected outcomes.

An AI-generated test can look correct while validating the wrong behaviour. In my experience, the most dangerous failures are not syntax errors but incorrect assumptions that quietly become part of the test suite.

My approach is:

### Do

* Use AI to accelerate repetitive implementation work.
* Keep expected results human-reviewed.
* Keep golden datasets under manual ownership.
* Focus assertions on behaviour rather than wording.
* Regularly review generated tests for duplicated or weak coverage.

### Don't

* Let AI define business rules.
* Let AI generate expected outcomes without validation.
* Trust generated assertions without reviewing them.
* Use brittle exact-text assertions unless required.
* Assume generated tests provide meaningful coverage simply because they run successfully.

## What I Would Add With More Time

If I had more time, I would expand the evaluation strategy in four areas.

First, I would introduce groundedness evaluation using a tool such as Ragas or an LLM-as-judge approach to verify that answer content is genuinely supported by the cited documents.

Second, I would expand the adversarial test set with a larger collection of prompt-injection and role-escalation attempts to better evaluate guardrail consistency.

Third, I would introduce drift monitoring. Running the golden dataset regularly against the live environment would help detect behavioural changes caused by prompt updates, retrieval-index rebuilds, or model upgrades.

Finally, I would add performance and latency baselines for the `/query` endpoint. While correctness is the immediate priority, response time becomes increasingly important once the core access-control and grounding rules are stable.

The biggest takeaway from this exercise is that successful testing of a RAG system requires a combination of deterministic validation and AI-specific evaluation. Traditional QA techniques remain essential for enforcing access rules and document visibility, while AI evaluation tooling becomes valuable when assessing answer quality, grounding, and behavioural drift over time.
