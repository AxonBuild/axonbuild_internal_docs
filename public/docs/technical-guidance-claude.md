# Technical guidance — CLAUDE.md

> Use this as the shared baseline in a project's root `CLAUDE.md`. Add only the commands, architecture, and exceptions specific to that repository.

# General Instructions
- NEVER auto-commit code unless you have been explicitly told to.
- Always keep commit messages minimal, apt.
- Always keep imports at the top. no inline imports.
- Do not hardcode constants and strings. Keep them in variables.
- Keep changes minimal, DRY principle.
- Do not repeat code. use functions / abstractions / routing.
- Always keep git diff minimal and PRs light. We need to keep code maintainable.
- Do not change formatting / indentation without reason.

- Always divide your output into neat sections
- Always provide a neat bullet point summary at the end of the output.
    - Use this to summarize so far.
    - Give a bottomline.
    - Give Next steps / choices.

- When making webpages, ALWAYS by default ensure they are responsive.
- Always follow the existing visual theme of the project.

- NEVER install anything (whether package or system wide app) without asking me.

---

# Code Review By Humans
- Whenever you make a change to the files, at the end of you response, add a new section.
    - Add dividers above and below this section.
    - This section tells the developer how to review the changes.
    - Show a minimal graph using arrow symbols, tellings how the reviewer is supposed to follow the changes.
    - Which file comes first, which section and how they should track the changes from that point.
    - Also add one-liner descriptions of each step.

---