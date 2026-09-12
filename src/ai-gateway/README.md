# `ai-gateway/` — AI Provider Gateway (contracts and provenance only)

Reserved in FABLE-01 §10; **opened, narrowly, in FABLE-03 §6**. It is no
longer empty — but it still holds no provider integration, no routing, no
model name, no key and no call. Doc 09 keeps multi-provider routing out of
V1, and doc 16 §5 lists "provider concepts in the domain model" as an
audit-fail pattern, so nothing here names one (INV-32).

What is here: `contexts.ts`, the **Learner Assistance Intelligence Context**
(INV-31). Its input is the sanitized learner item shape and nothing else —
enforced by the type, by re-running the engine's `sanitize()` (which throws
on any answer-key field), and by rebuilding the context field by field from
an allow-list rather than passing an object through. Answer keys,
rationale-to-correct mappings and misconception codes cannot reach it.

The assistance a learner actually receives in FABLE-03 is authored text
served by `open_assistance()` and re-checked against INV-02 in the database.
This boundary exists so that when a model is one day asked to phrase a hint,
what it is given is already decided, already narrow, and already testable.

Domain and UI code never call a model provider directly. Privileged data
(answer keys, raw evidence, integrity material) never enters a learner
context.
