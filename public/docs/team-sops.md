# Team SOPs (Obsolete)

> This page is archived. Use the [current Team SOPs](/p/team-sops-current) instead.

> Rules we actually try to live by. Nothing fancy — just how we keep the wheels on.

---

**1. Daily updates in the tracker**

When you wrap something up (or even partway through), jot it in the tracker while you still remember the details. If you wait, you’ll fuzzy it up — and “I’m pretty sure it was almost done” helps nobody.

You don’t have to write a lot. A few lines is fine: what you did, what’s stuck, what you’ll do next. The point is so someone else can read it and know what’s going on without having to chase you. Empty tracker = we’re all guessing.

**2. Notes in meetings**

Write stuff down. If it never got written down, it’s easy for everyone to remember it differently later — and “I assumed someone else took notes” usually means nobody did.

Decisions, who’s doing what, and weird little “oh yeah, if X then Y” moments are worth saving. One shared doc or thread beats ten side DMs. You won’t remember the vibe in two weeks; you’ll just remember feeling like you agreed on something.

**3. Attention to detail**

A lot of “almost done” problems are small: a typo, a case nobody tested, a box nobody checked. Catching that stuff early is way cheaper than catching it in prod or in a rushed fix at night.

We’re not asking for perfection on everything. We’re asking you to read the ticket again, skim the copy, and think “what goes wrong if I missed something here?” Fixing it now is usually quicker and less stressful than fixing it when everyone’s watching.

**4. Before you log off**

Ping **Shaff** or **Hisan** before you head out, especially if you’re mid-task or handing something off. A quick “here’s where I left this” takes almost no time and saves a lot of “wait, what was happening with that?” later.

If you’re blocked, say that too before you disappear. No update often reads like “all good” until suddenly it isn’t. We’re not big on formal rituals — we just like knowing where things stand.

**5. AI code review — required before humans see the PR**

This one isn’t optional. **Every PR** gets a full pass through AI **before** it goes to human review. The goal is to squeeze as much as we can out of the tools we have: typos and style, sure — but especially **edge cases**, **holes in the logic**, and “what happens if this assumption breaks?”

Use AI like a picky reviewer who doesn’t get tired. Ask it to stress-test your reasoning, find loopholes, and call out paths you didn’t think through. You still own the code — sanity-check anything critical — but **no skipping this step**. <u>Humans shouldn’t be the first line of defense for stuff AI can flag in five minutes.</u>

**What you attach to the PR (required):**

- **Implementation summary (AI-generated, then edited by you).** A clear, honest description of what changed and why — so reviewers start informed instead of reverse-engineering the diff.
- **Testing checklist (see point 6).** Same PR; same rule.

If those aren’t on the PR, treat it as incomplete — like forgetting the title.

**6. AI-assisted testing, automation, and the checklist you attach**

Leverage AI here as hard as you do in review. Have it propose **concrete test cases** — happy path, sad path, weird inputs, permission edge cases, whatever fits the change. Then **turn that into a checklist** you actually run against your work.

**Attach that checklist to the PR** and mark what you verified (and what you didn’t, if anything’s out of scope — say so explicitly). That gives everyone a shared picture of coverage: “this was exercised” vs “we didn’t touch this.” If something ships broken, we’re not guessing whether it was tested — the PR says what was claimed. Fair is fair.

**Automation when it makes sense:** scripts, unit/integration tests, **browser automation** (e.g. Playwright), **MCP-driven flows**, or whatever fits the repo — use them so you’re not only clicking through by hand when a machine can repeat the boring parts. AI can help draft or extend those too; you keep them honest.

Bottom line: **AI helps you build the test plan and the checklist; you run it (plus automation where applicable); you attach the checklist so the team can trust — and verify — what was checked.**

---

**In one breath:** update the tracker, take meeting notes, look twice at the small stuff, say hi before you clock out — then **AI-review every PR before humans**, attach **AI-grounded implementation summary + testing checklist**, and **use AI + automation** so testing is real, visible, and accountable.

_Take notes in meetings. Still. Always._
