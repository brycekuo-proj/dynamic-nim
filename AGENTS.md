# AGENTS.md — Dynamic Nim

- Primary task specification: read and obey `TASK.md`.
- GLOBAL L1–L30 MOVE INVARIANT: every level uses the same immutable move rules from `CORE_MOVE_RULES`: remove 1–3 contiguous circles along horizontal, vertical, or 45° diagonal lines (↘ / ↙), never across a gap. Chapters may change only the deterministic world transformation after removal; do not weaken, replace, or override these move directions per level.
- Build the playable L1–L10 prototype, not merely a plan or snippets.
- Work phase-by-phase and run tests at every phase boundary.
- Solver correctness and deterministic transformations are higher priority than visual polish.
- Level design must be changed if validator results contradict the intended teaching goal.
- Keep game/domain logic separate from rendering/input/UI.
- At completion run the full test suite, level validator, and production build.
- Update README with launch instructions, architecture, L1–L10 validation results, test results, known limitations, and next steps.
- Before final completion, commit all changes and push to `origin main`.
