# Team SOPs — CLAUDE.md


## Communication

- Synapse should be your source of truth. Update what changed, what is blocked, and what happens next.
- Record meeting decisions, owners, follow-ups, and important edge cases in card comments.
- Before logging off, update the Synapse cards. Updates for the day go into comments.
- Surface blockers early. Do not let silence imply that work is on track.

## Working agreement

- Read the ticket and repository instructions before changing code.
- For non-trivial work, outline the approach and identify risks before implementation.
- Keep the change focused. Do not reformat or refactor unrelated code.
- When using AI, always create design docs, PR descriptions, and test checklists.
- Understand what you are implementing. More important than ever, in this AI age.
- Verify new ideas across multiple sessions and use different LLMs.


## Before opening a PR

1. Self-review the complete diff.
2. Run the relevant automated checks and test the affected user paths.
3. Ask AI to review the full diff for logic gaps, regressions, security issues, and missed edge cases.
4. Resolve valid findings and rerun affected checks.
5. Attach an AI-drafted, human-edited implementation summary.
6. Attach a test checklist showing what passed, what was checked manually, and anything not tested.

A PR is not ready for human review until the summary and completed test checklist are present.

## Handoff to human reviewers

End the implementation report with:

- a concise summary and bottom line;
- test and verification results;
- open risks or next-step choices; and
- a minimal review path showing the order in which changed files should be read.

Example: `entry point -> core logic -> tests -> configuration`

The author still owns the result. AI review supports judgment; it does not replace it.
