# PINTAR 3.0 — GITHUB TRANSITION MASTER CONTEXT

> Binding operating context for all repository work. Saved verbatim 2026-08-09.

Read this completely before doing any further work on the repository.

This is a context reset.

We are moving PINTAR 3.0 to GitHub because the project has reached a level of maturity where its source code, database evolution, configuration, documentation, and deployment requirements must have a single, authoritative, recoverable source of truth.

This is NOT primarily a GitHub exercise.

It is a PINTAR continuity, integrity, reproducibility, and governance exercise.


============================================================
1. WHY WE ARE MOVING TO GITHUB
============================================================

Until now, PINTAR has been developed rapidly through local working directories, delivery bundles, SQL migrations, Supabase changes, curriculum assets, documentation, and AI-assisted development.

That worked during rapid development.

It is no longer sufficient.

PINTAR is becoming a real production platform with institutional pilots, real users, curriculum content, assessment data, security requirements, and a growing database architecture.

We therefore need GitHub to provide:

1. A canonical source of truth for the application code.
2. Complete version history.
3. Complete database migration history.
4. Recoverability if a local development machine is lost.
5. Reproducibility on a clean machine.
6. Traceability of future changes.
7. Safe collaboration between developers and AI agents.
8. A reliable basis for testing, CI/CD, deployment, rollback, and audit.
9. Separation between current production source and historical development artifacts.
10. Freedom from dependence on any one person's computer, working folder, conversation, or AI memory.

The objective is NOT:

"Put the PINTAR folder on GitHub."

The objective is:

"Create an authoritative repository from which PINTAR can be understood, rebuilt, tested, maintained, and eventually deployed safely."


============================================================
2. THE STANDARD OF SUCCESS
============================================================

The repository must eventually pass this conceptual test:

A competent developer who has never seen Yazid's computer and has no access to previous Claude/Gemini/ChatGPT conversations should be able to:

    git clone
        ↓
    read the documentation
        ↓
    install dependencies
        ↓
    create the required environment configuration
        ↓
    provision/reconstruct the database
        ↓
    run migrations in the correct order
        ↓
    obtain or connect required content assets
        ↓
    start PINTAR
        ↓
    run verification/tests
        ↓
    understand the architecture
        ↓
    continue development safely

If that cannot be done, the repository is not yet complete.


============================================================
3. IMPORTANT LESSON FROM THE FIRST GITHUB ATTEMPT
============================================================

The first repository preparation exposed serious gaps.

Examples already discovered include:

- The initial package contained only part of the SQL migration history.
- A later reconciliation found a much larger migration set.
- Supabase verification scripts were missing.
- Documentation was incomplete/missing.
- .gitignore was initially missing.
- .env.example was initially missing.
- CI workflow placement needed reconciliation.
- package-lock.json/build verification still required attention.
- Historical delivery bundles and authoritative source had not been clearly separated.
- Large curriculum/media assets created GitHub file-size problems.
- Moving those assets elsewhere raised another unanswered architectural question:
  how does PINTAR reliably locate and consume those assets?

These are not cosmetic issues.

A repository can look complete while being operationally incomplete.

That is unacceptable for the canonical PINTAR repository.


============================================================
4. SOURCE OF TRUTH — DO NOT ASSUME
============================================================

From this point forward:

DO NOT assume a delivery ZIP is complete.

DO NOT assume the newest folder contains everything required.

DO NOT assume a migration is obsolete merely because a later migration exists.

DO NOT assume files mentioned in previous conversations actually exist.

DO NOT assume an application builds because the source looks correct.

DO NOT assume an asset URL works because a browser can open a sharing page.

DO NOT assume a configuration variable exists because it was discussed.

DO NOT silently reconstruct missing information from memory.

Verify against actual files and actual system state wherever possible.

If two sources disagree, identify the conflict explicitly.

Do not quietly choose one.


============================================================
5. GITHUB IS NOT BULK STORAGE
============================================================

We must distinguish between:

A. SOURCE / CONFIGURATION / DOCUMENTATION

Generally appropriate for GitHub:

- application source code
- SQL migrations
- database functions/policies
- verification scripts
- small fixtures
- tests
- CI/CD configuration
- documentation
- architecture decisions
- configuration templates
- package manifests and lock files
- scripts required to reconstruct or operate PINTAR

B. SECRETS

NEVER commit:

- .env
- API keys
- service-role keys
- passwords
- private tokens
- database credentials
- signing secrets
- production secrets

Only safe templates such as .env.example belong in Git.

C. LARGE RUNTIME CONTENT

Large files such as:

- videos
- audio
- large PDFs
- slide decks
- curriculum media packages

should not automatically be committed to the normal Git repository.

They should normally live in appropriate object/content storage.

PINTAR should reference them through an explicit, documented, reproducible mechanism.

Google Drive may be acceptable as temporary development storage, but do not assume that a Google Drive sharing URL is an appropriate production content architecture.

PINTAR already uses Supabase, so Supabase Storage or another proper object-storage/CDN architecture should be evaluated for production use.


============================================================
6. CONTENT STORAGE MUST HAVE A COMPLETE CONTRACT
============================================================

"Upload the files somewhere" is NOT a complete solution.

For external content, we must know:

1. Where is the asset stored?
2. What is its canonical identifier?
3. How does PINTAR resolve it?
4. Is the URL public, signed, or authenticated?
5. Where is that reference stored?
6. What configuration is environment-specific?
7. What happens if the asset moves?
8. How are permissions controlled?
9. How are audio/video files delivered efficiently?
10. How is the configuration reproduced on another machine?
11. How is production different from development?
12. How do we verify automatically that referenced assets exist?

The chain must be explicit:

STORAGE
    ↓
ASSET IDENTIFIER / URL
    ↓
DATABASE / MANIFEST / CONFIGURATION
    ↓
PINTAR APPLICATION
    ↓
USER

No step may depend on somebody remembering what to do manually.


============================================================
7. DATABASE MIGRATIONS ARE FIRST-CLASS SOURCE CODE
============================================================

PINTAR's database schema is part of the product.

Migration history must therefore be treated with the same seriousness as application source code.

We need to know:

- Which migrations exist.
- Their canonical order.
- Whether numbering conflicts exist.
- Whether migrations are idempotent where appropriate.
- Whether any migration exists only inside a historical delivery folder.
- Whether the current database contains changes not represented in migrations.
- Whether migrations can reconstruct the required schema from a clean database.
- Which scripts are migrations versus verification scripts versus operational scripts.

Do NOT delete, rename, consolidate, or rewrite historical migrations merely to make the directory look clean unless the consequences have been explicitly analyzed.

A tidy migration directory that cannot reproduce the database is worse than a messy but accurate one.


============================================================
8. HISTORICAL DELIVERY BUNDLES
============================================================

PINTAR contains many delivery-* directories created during rapid development.

These need classification.

They may contain:

- historical snapshots
- duplicate source
- unique source
- migration files
- verification scripts
- documentation
- test artifacts
- obsolete implementations

Do NOT blindly commit all of them.

Do NOT blindly delete all of them.

First determine whether each contains anything that is not represented in the canonical source tree.

Then classify it appropriately:

CANONICAL
ARCHIVE
REDUNDANT
GENERATED
TEMPORARY
UNKNOWN / REQUIRES REVIEW

The final repository should clearly distinguish:

"What PINTAR IS now"

from:

"How PINTAR got here."


============================================================
9. REPRODUCIBILITY BEFORE ELEGANCE
============================================================

At this stage, completeness is more important than making the repository aesthetically perfect.

First establish:

- nothing critical is missing
- migrations are reconciled
- dependencies are deterministic
- environment variables are documented
- build works
- tests/verification work
- external assets are resolvable
- secrets are excluded

Only then optimize repository structure.

Do not perform aggressive cleanup before establishing provenance.


============================================================
10. AI OPERATING PRINCIPLE
============================================================

Claude, Gemini, ChatGPT, or any future AI working on PINTAR must not be treated as the source of truth.

The artifacts are the source of truth.

Therefore:

"AI says it is complete"

does NOT mean complete.

Completion requires evidence.

Examples:

Migration complete
→ enumerate and reconcile migrations.

Repository complete
→ test a fresh clone.

Environment documented
→ attempt setup using only .env.example.

Database reproducible
→ apply migrations to a clean database.

Build ready
→ execute the production build.

Assets connected
→ load them through PINTAR itself.

CI working
→ verify that CI detects an intentional failure.

Documentation sufficient
→ follow it as though you have no previous knowledge of PINTAR.

The principle is:

TRUST THE PROFESSIONAL.
VERIFY THE ARTIFACT.


============================================================
11. DO NOT SOLVE ONLY THE IMMEDIATE QUESTION
============================================================

This is particularly important.

When asked:

"Can we store the content on Google Drive?"

Do not stop at:

"Yes."

Follow the dependency chain.

Ask internally:

If we do that, how does PINTAR consume it?
Where does the URL live?
Does the application require configuration changes?
What happens in production?
What are the security implications?
Can another developer reproduce this?
Is this temporary or architectural?

Likewise, if asked to move something into GitHub, consider:

What depends on it?
What references it?
What must not be committed?
What must accompany it?
What happens on a clean clone?

We need SYSTEM-COMPLETE answers, not merely LOCALLY-CORRECT answers.


============================================================
12. DO NOT OVERENGINEER
============================================================

The opposite mistake is also possible.

Do not turn this transition into an unnecessary enterprise DevOps project.

PINTAR needs:

- reliable version control
- reproducibility
- sensible CI
- clear documentation
- safe secret handling
- reliable database migrations
- appropriate asset storage
- recoverability

It does not need complexity merely because GitHub makes complexity possible.

Prefer the simplest architecture that satisfies the actual requirement.


============================================================
13. PINTAR ENGINEERING PHILOSOPHY STILL APPLIES
============================================================

GitHub does not change what PINTAR is.

The same principles remain:

- calm systems
- invisible machinery
- human dignity
- evidence over assumption
- security by design
- auditability
- least privilege
- deliberate architecture
- simple user experience over technical spectacle

Complexity belongs behind the interface.

The repository should eventually reflect the same philosophy.


============================================================
14. CURRENT PRIORITY
============================================================

Our immediate objective is NOT to add more PINTAR features.

Our immediate objective is to establish a trustworthy canonical baseline.

Before proceeding with normal development, we need confidence that:

1. The complete authoritative source is identified.
2. Database migrations are fully reconciled.
3. Verification scripts are preserved.
4. Required documentation is present.
5. Dependencies and lock files are correct.
6. Secrets are excluded.
7. .env.example accurately describes required configuration.
8. Large assets have an explicit storage strategy.
9. Historical delivery bundles are classified.
10. The application can be built from the repository.
11. The repository can eventually reconstruct a working PINTAR environment.


============================================================
15. YOUR ROLE
============================================================

Before recommending or executing another GitHub-related action:

Think through the entire consequence chain.

If you find uncertainty, say so.

If you find contradictory evidence, stop and report it.

If something has not actually been tested, say:

"NOT YET VERIFIED."

Do not convert assumptions into facts.

Do not optimize away evidence.

Do not declare completion based on file presence alone.

Our goal is not to get PINTAR onto GitHub as quickly as possible.

Our goal is to make GitHub the trustworthy engineering foundation for the next stage of PINTAR.


FINAL PRINCIPLE:

PINTAR MUST NEVER DEPEND ON US REMEMBERING WHERE SOMETHING IS.

The repository, database architecture, configuration documentation,
and storage architecture must tell the story themselves.
