# ADR-0023 — A Management workflow discovers its subjects through the rule that governs them, not through learner visibility

**Status:** Accepted · **Date:** 2026-09-22 · **Phase:** WP7D backend unblocker,
migration 20261001100000 · **Scope:** one feedback-domain read, and the
refactor that gives it and `open_feedback_cycle` a single rule. No change to
the anonymity architecture, the threshold, the question set, the cycle state
machine, the audit behaviour or `person_visible_to_me`.

## The gap

WP7B gave Management the authority to open a feedback cycle about an educator
and no way to learn who that educator is. `open_feedback_cycle` takes a person
id; nothing an authorized head of department could read would produce one.
Measured on a clean stack as a real `authenticated` session, for a head of
department who **does** hold Management scope over the class:

| what was asked | answer |
|---|---|
| `management_scope_over_node(class)` | true |
| `person_visible_to_me(educator)` | **false** |
| `role_assignments` rows readable about that educator | **0** |
| `persons` rows readable about that educator | **0** |
| `members_of_node_at(class)` contains the educator | **no** |

Each of those is correct on its own terms. `person_visible_to_me` is
**learner-shaped**: self, an institution administrator over an enrolment, a
roster holder over a membership, portable visibility after a transfer. An
educator who teaches a class is none of those — unless they also happen to be
enrolled as a learner in the reader's scope, which the first fixture to
exercise this path happened to have. That coincidence is why the hole stayed
invisible until a surface was built over it.

## Decision 1 — the fix is a feedback-domain read, not wider person visibility

Teaching `person_visible_to_me` about educators would have been one line and
the wrong line: a learner-visibility predicate that starts answering about
colleagues is a different product decision reached by accident, and it would
have widened every other surface that predicate governs. The same is true of a
`staff_in_scope()` or `educators_in_institution()` primitive — a staff
directory with a feedback-shaped excuse.

`feedback_subjects_for_class(p_node)` answers one question, for one class, to
the role set that operates the cycle: **which educators may this Management
caller open a feedback cycle about?** Two columns, `person_id` and
`display_name`. No email, account, auth uid, institutional identity, enrolment,
membership, other role, cycle, participation, count, threshold or aggregate.

## Decision 2 — one rule, read twice, never written twice

The failure a discovery endpoint invites is two rules: one that lists people
and one that accepts them. So the subject rule moved out of
`open_feedback_cycle` into `feedback_subject_candidates(p_node)` — internal, no
client grant, no registry row, because it is the rule and not an endpoint — and
the endpoint now **asks that set** the question it used to answer inline. Its
signature, its checks, their order and its sentences are unchanged.

`assert_feedback_is_not_evidence()` now also fails if either subject function
reads an opportunity, a response or a result, if the Management projection
stops being exactly two columns, or if the rule becomes client-callable.

## Decision 3 — discovery is advisory; opening still decides

A candidate list describes the world at the moment it was read. Authority can
be revoked, an assignment can end, a class can be reached by
professional-development material. `open_feedback_cycle` re-authorizes the
caller and re-validates the subject on every call, and there is no token, no
signed claim, no cached entitlement and no "discovered therefore authorized"
path. F07-P15 proves it: an educator listed a moment ago, whose assignment is
then revoked through the product's own `revoke_role`, is refused by the open
contract on its own re-validation.

The ACADEMIC rule is deliberately **not** restated in discovery. It is a fact
about the class, not about the subject, and it stays in the endpoint that owns
it — so discovery can name an educator of a class whose cycle `open` refuses on
context grounds. That is the advisory contract working, not two rules
disagreeing, and F07-P14 measures exactly that case.

## Consequences and residuals

- A Management surface can now name the subject of a cycle without any reader
  being given a general view of staff. The display identity the feedback
  experience needs comes from the feedback contract.
- The caller is never among their own candidates, because the open contract
  refuses `subject = caller`. A head of department who also teaches the class
  is therefore offered by a dean and not by themselves.
- **Carried unchanged:** the WP7B ACADEMIC over-rejection; the unanimity
  residual; the privileged `xmin` residual. None of them is worked around here.
- **Not solved:** a cycle whose subject's EDUCATOR assignment has since ended
  has no legitimate-candidate row, so a surface resolving names through this
  contract alone will still show nothing for it. Widening the contract to past
  subjects would change the question it answers, and that is a ruling, not an
  implementation detail.
