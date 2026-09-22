# ADR-0024 — An institution assembles its own report, and defines nothing

**Status:** accepted (WP8, W8-02)
**Supersedes nothing. Does not change** the metric catalogue, the evaluator, the
report engine, or any authorization rule.

## Context

PINTAR 4.0 requires that authorized institutions may assemble reusable report
templates from an approved subset of PINTAR's canonical metrics, with
authorization filtering first.

By WP7 everything that requirement needs existed except the act itself:

- `metric_catalogue` / `metric_definitions` — PINTAR's metrics, their formulas,
  meanings, minimum samples, permitted visualizations and permitted audiences,
  versioned and published by SYSTEM_ADMIN.
- `report_templates` / `report_template_metrics` — institution-scoped, RLS-gated
  on `CAN_MANAGE_REPORT_TEMPLATES`, with triggers enforcing that a template
  selects from the live catalogue and never defines.
- `generate_report` — refuses a foreign institution and a foreign scope node,
  then calls `metric_evaluate` per metric, which re-authorizes each one against
  the reader.

And `report_templates` held **zero rows in every environment** — local, CI and
hosted — because no product path could write one. The Dean and Educator summary
surfaces read a template, found none, and rendered their empty state
permanently. `src/lib/pengajar.ts` names its four class metrics inline and says
why: saving a template needs a capability an educator does not hold.

The engine was complete and unreachable.

## Decision

Add **one endpoint and one panel**, and nothing else.

`public.save_report_template(p_institution, p_standard_report, p_title_key,
p_metrics, p_template default null) returns uuid`

- **Authorization is the first gate.** `can_in_institution(
  'CAN_MANAGE_REPORT_TEMPLATES', p_institution)` is checked before any argument
  is resolved, so a refusal is an authorization refusal rather than a lookup
  that failed. This is RF-2's lesson applied where it was cheap to apply.
- **It leans on the existing guards.** The catalogue rules — the metric must
  exist in the live version, must not be deprecated, and the visualization must
  be one that metric permits — stay in
  `enforce_report_template_metric`, which the row writes pass through. There is
  one place where the approved subset is decided, not two.
- **A revision is a new version.** `generated_reports` records the
  `template_version` it was made from, so a report already issued keeps saying
  which assembly produced it.
- **At most twelve metrics.** A product boundary, not a technical one: this is a
  standard report, not a canvas.
- **The act is audited** and carries no figure.

The surface is the `intelligence` section of the existing configuration studio,
which was an empty placeholder. It lists the school's templates and offers one
form. It can send a metric id, an order and a visualization, and has no field
for anything else.

## What an institution may not do

Define a metric, change a formula, change a meaning, change an audience, change
a minimum sample, retire a metric, or assemble for another school. The endpoint
takes no argument that could reach any of them, `metric_definitions` refuses
UPDATE by trigger, and the tests plant each attempt: F08-P04.

## Consequences

- Report configuration is usable on a fresh institution the moment the
  migrations are applied. Nothing is seeded, correctly: a template is the
  school's.
- Retiring a metric remains a PINTAR act with no exposed surface (OQ-5,
  unchanged). WP8 adds only that a *newly selected* metric may not be one that
  is already retired — W8-03 — while a template that named it before the
  retirement keeps its row.
- The catalogue's `allowed_audiences` is still enforced by `metric_evaluate` at
  read time rather than at assembly time. A template may name a metric its
  author cannot read; the report then carries `not_permitted` with no label for
  that reader. This is deliberate — a template is a request, not an entitlement
  — and is the same rule `generate_report` already applied.
