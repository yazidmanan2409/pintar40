# `ai-gateway/` — AI Provider Gateway (reserved; contracts only)

Reserved in FABLE-01 §10. Empty by design: **no provider integration exists
in this phase, and no provider concept enters the domain model** (doc 16 §5
lists "provider concepts in the domain model" as an audit-fail pattern).

When a later phase opens this boundary it holds only the *contracts*
(request/response shapes, redaction rules, cost and audit hooks) that every
AI-assisted feature must go through. Domain and UI code never call a model
provider directly, and privileged data (answer keys, evidence, integrity
material) never enters a learner-assistance context (doc 16 §5).
