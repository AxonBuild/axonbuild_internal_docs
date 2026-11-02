# Retell voice agents: practical engineering guide

A guide to building, testing, and releasing voice agents that book appointments, qualify leads, and transfer calls. Start with sections 1–11; use references A–E for reusable instructions, code, QA templates, and production examples.

**Main rule: make decisions in code. Give the model only the instructions and values it needs for this call.**

Platform behavior and incidents here come from the original engineering handbook, not a new audit of the current API. The test harness and QA template are reusable examples based on that handbook.

## Contents

- [1. Choose the agent type](#1-choose-the-agent-type)
- [2. Know the main parts](#2-know-the-main-parts)
- [3. Build only the prompt this call needs](#3-build-only-the-prompt-this-call-needs)
- [4. Agree on the input data](#4-agree-on-the-input-data)
- [5. Keep code small and predictable](#5-keep-code-small-and-predictable)
- [6. Write for a phone conversation](#6-write-for-a-phone-conversation)
- [7. Handle time in code](#7-handle-time-in-code)
- [8. Check speed, audio, and phone behavior](#8-check-speed-audio-and-phone-behavior)
- [9. Test the code and the conversation](#9-test-the-code-and-the-conversation)
- [10. Agree on disclosures and caller exits](#10-agree-on-disclosures-and-caller-exits)
- [11. Release and debug carefully](#11-release-and-debug-carefully)
- [Reference A: Reusable conversation style](#reference-a-reusable-conversation-style)
- [Reference B: JavaScript test harness and CI](#reference-b-javascript-test-harness-and-ci)
- [Reference C: Retell variables and routing examples](#reference-c-retell-variables-and-routing-examples)
- [Reference D: QA test-case template](#reference-d-qa-test-case-template)
- [Reference E: Production incidents and safeguards](#reference-e-production-incidents-and-safeguards)

## 1. Choose the agent type

| Type | Use it when | How to debug it |
|---|---|---|
| Single prompt (`retell-llm`) | Calls need flexible wording and many decisions based on caller data | Read the final prompt sent to the model |
| Conversation flow | Calls follow a set path that clients need to review | Follow the nodes and branches used during the call |

Keep a working design unless there is a clear reason to switch. For client reviews, show a short journey list or one small diagram per call path.

Use separate agents for inbound, outbound, and callback calls. Share common code between them.

## 2. Know the main parts

An agent has three parts: a **prompt** for conversation rules, **code** for decisions and formatting, and **settings** for voice, timing, and tools.

| Where it lives | Main fields |
|---|---|
| LLM object | `general_prompt`, `general_tools`, `start_speaker`, `begin_message`, `begin_after_user_silence_ms`, `default_dynamic_variables`, `model`, `model_temperature` |
| Agent object | `pre_session_tools`, voice settings, `responsiveness`, `interruption_sensitivity`, call and silence limits, `pronunciation_dictionary`, `post_call_analysis_data` |

Write each field to the object that owns it. Always read it back to confirm the change.

Choose tools by what they need to do:

- **`code`:** reads call variables (`dv`) and returns calculated values or prompt text. It does not accept model-supplied arguments.
- **`custom`:** calls a webhook and can accept model-supplied arguments.
- **`extract_dynamic_variable`:** saves information the caller gives during the call.
- **`transfer_call` / `end_call`:** transfers or ends the call.

## 3. Build only the prompt this call needs

Keep shared instructions in the main prompt. Fill in call-specific sections with code:

```text
{{section_opener}}
{{section_discovery}}
{{section_routing}}
{{section_scheduling}}
```

Run setup code through `pre_session_tools` before the conversation starts. Keep mid-call tools for actions that need new caller information, such as lookups or transfers.

When building sections:

- **Choose the branch in code.** If booking is disabled, leave booking instructions out.
- **Remove values the model must not say.** Remove them from instructions, variables, and summaries.
- **Use finished wording.** Insert the actual name or a natural fallback such as “someone on our team.”
- **Put rules beside the data they control.** Place “only offer these times” next to the available times.
- **Make the next step clear.** Avoid vague headers such as “only when routed here.”
- **Replace old results clearly.** If a tool returns new availability, say that it replaces the previous list and apply the same filters.
- **Define what ends a step.** For an “ask once” step, state what happens after an answer, refusal, question, or silence.

Keep shared tone rules in one place so all agents use the same version.

### Extra rules for conversation flows

- Use exact edge labels: `Else`, `Skip response`, and `Always`.
- Conversation-node edges normally wait for the caller to speak. Use `skip_response_edge` when the agent should say a line and move on immediately.
- Code nodes cannot read the transcript. Extract caller answers into variables first, then map code outputs through `response_variables`.
- Extraction entries use `type`, not `variableType`. Include an `else_edge` so the path cannot get stuck.
- Make branch conditions mutually exclusive. Use code for exact comparisons and routing decisions.
- If a shared step needs different next steps, calculate the route in a code node.
- Give each greeting, disclosure, acknowledgment, and closing one owning node.
- After moving a node, check words such as “already,” “just,” “last,” and “next.” They may no longer make sense.
- Check saved fields and test the route. Unknown fields may be stored without doing anything.

## 4. Agree on the input data

The **payload** is the data sent with a call. Document every field, its accepted values, and what missing or blank values mean. Agree on this with the backend team.

Handle missing values without crashing, and preserve meaningful values such as `false` and `0`:

```js
const text = key => String(dv[key] ?? "").trim();
const outOfArea = text("zip_in_area").toLowerCase() === "false";
```

Do not treat blank as false unless the contract says so. Report unknown status values clearly instead of silently choosing a normal route. If fields disagree, define which one wins.

### Where variables come from

| Source | When it is available | Purpose |
|---|---|---|
| Call payload | At call creation | CRM data, names, flags, availability |
| Agent defaults | When the payload omits a field | Values the CRM never supplies |
| Code return values | After the tool runs | Calculated values and prompt sections |
| Extraction tools | During the call | Caller answers |

The payload overrides defaults. Code return values overwrite variables with the same name:

```js
return {
  section_routing,
  offer_range_spoken: offerEnabled ? range : ""
};
```

**Keep defaults away from CRM-owned fields.** A leftover test default can become live call data. A “this step ran” flag must be set by that step and have no default.

Also check these cases:

- A missing field can use a default; a field sent as `""` does not.
- Setup code cannot use answers the caller has not given yet.
- Mid-call code reads the current variables. Extract an answer first, then calculate from it.
- Some extraction names may include braces. Check whether the key is `edv_timezone` or `{{edv_timezone}}`.
- Every `{{variable}}` needs a source, and every generated prompt section must be used.

Request structured data where possible: timestamps and timezone names are easier to use safely than spoken date strings.

## 5. Keep code small and predictable

Code tools should return the same result for the same input and clock. Keep them self-contained and fast.

- Use plain JavaScript. Do not rely on `require`, `fetch`, `process`, `async`, or `Intl` in this runtime.
- Limit loops and handle failure results explicitly.
- Decide what happens when input is missing, malformed, or unusable.
- Handle known formatting differences without silently dropping data.
- Explain unusual rules in comments, especially guards added after an incident.
- Check both tool size and total agent size during the build. Do not assume character count equals token count.

A fallback is a product decision. For example, if timezone conversion fails, speaking valid source-zone times may be acceptable. If the current time cannot be established, offering an appointment may not be safe. Write down the choice.

## 6. Write for a phone conversation

Callers hear each line once. Use short sentences, everyday words, and one question at a time. Put important instructions beside the step where they apply.

Mark required wording as **LOCKED**, especially disclosures and removal confirmations. Keep those lines short.

Use these shared conversation rules:

- Be warm and direct. Usually use no more than two sentences before a question.
- Vary the rhythm. Do not begin every turn with thanks, a recap, or the same acknowledgment.
- Briefly reflect meaningful context in your own words. Do not repeat the caller's answers as a list.
- Refer to earlier details when useful, and do not ask for information already given.
- Answer the caller's question before returning to the next useful step.
- If you cannot answer, say the team can help. Do not guess or promise an answer you do not have.
- Reword an unanswered question more briefly or move on. Do not replay the greeting.
- After asking a question, wait for the answer before closing or ending the call.
- Close once. If the caller keeps talking, respond to what they said.
- Use positive reactions for positive news, not for neutral details or distress.
- Vary recovery lines after mishearing. Avoid unnecessary requests to repeat information.
- Address the objection raised. If it is repeated, stop probing and move on.
- Use fillers sparingly, if at all; never in locked wording or distress responses.

Prepare spoken names, numbers, dates, and times in code. For example, use “2 in the afternoon” and “example dot com.” Do not let the model calculate weekdays or read raw URLs and field labels.

### Handle failure paths carefully

Write clear, natural lines for failed verification, missing records, failed transfers, and unavailable bookings.

- Refer briefly to what the caller said so the response feels connected.
- Do not invent a cause for a failure.
- Verification retries must not reveal stored values or which check failed.
- Only say “saved,” “booked,” or “made a note” after a tool confirms that action.
- Describe what happens for the caller. Internal phrases such as “this node terminates” can leak into speech.

## 7. Handle time in code

Store an appointment as an exact timestamp with a timezone. Convert it using the timezone offset for that appointment date, including daylight-saving changes.

- Give the model a finished list of times. Never ask it to shift hours or calculate dates.
- Handle zones without daylight saving before broader regional matches. Test transition dates and regional exceptions.
- Add a minimum notice period so a slot does not become too soon while the call is running. Apply it to every replacement list too.
- Use the caller's timezone for phone appointments and the property's timezone for site visits.
- Ask one clarifying question for an ambiguous timezone. If it remains unclear, state the business timezone explicitly.
- Send the exact timestamp when booking, not the spoken time label.

Use this fallback order for the current time:

1. Use a valid payload timestamp that includes the time and zone.
2. Otherwise, use a checked server clock in the business timezone.
3. If only a reliable date is available, withhold today's slots.
4. If neither is reliable, offer no times and hand off to a human.

Check for an implausible or frozen clock. A date alone must not quietly become midnight.

## 8. Check speed, audio, and phone behavior

### Avoid long silences

`start_speaker: user` delays the first model turn until the caller speaks. Setup work at that point delays the reply, so run it before the session.

A scripted `begin_message` is spoken directly by text-to-speech (TTS), without a model turn. Use it where a fixed opening fits.

Before a slow lookup, tell the caller once that there will be a wait. Then wait for the result; do not keep narrating or guess the outcome. Measure delays on real calls, including voice choice and silence settings.

### Separate speech problems from prompt problems

If the transcript is correct but the audio is wrong, fix the spoken text or voice settings. Test initials and names in voice preview. Use a per-client spoken-name field when one agent serves many clients; one pronunciation dictionary may not fit everyone.

If the caller's words were transcribed incorrectly, check speech recognition settings and relevant keywords before changing the prompt.

### Test real phone conditions

Decide how the agent should handle voicemail, phone menus, call screening, and unanswered ringing. For keypad input, define the digit count, end key, and timeout.

Use a knowledge base for changing factual content when needed. Keep call logic in the prompt or flow, and test retrieval delays and failures.

When a call behaves unexpectedly, confirm the phone-number routing, agent, version, account, and payload. Also check inbound webhooks or SIP routing where used.

## 9. Test the code and the conversation

Use three layers:

| Layer | What it checks |
|---|---|
| Unit tests | The actual code in the built or exported agent |
| Simulated conversations | What the model says and which route it takes |
| Real calls and recordings | Audio, pacing, interruptions, and phone behavior |

### Code checks

Test the shipped code, not a copied version. Check that it:

- Handles missing, blank, unexpected, and conflicting data.
- Returns the expected fields quickly and consistently.
- Does not produce `undefined`, `NaN`, unresolved placeholders, or broken sentences.
- Covers both sides of each toggle and each bug fix.
- Tests values just below, at, and above time or numeric boundaries.
- Uses whole values in assertions: “afternoon” contains “noon,” so substring checks can mislead.

Freeze both `Date.now()` and `new Date()` in time-based tests. Use one realistic base payload and change only the fields a case needs.

Check the full setup too: variable sources, generated sections, setup tools, shared functions, size limits, and sensible settings. Fail if an agent export is missing or duplicated, or if the test runner finds zero tests.

Use snapshots to review output changes, but keep behavior tests as the main check. On a disposable copy, inject realistic bugs to see whether tests catch them. Harmless changes should still pass.

Run tests on every pull request. Track existing known failures with an owner and fix condition so they do not hide new failures.

### Conversation cases

Each case needs an agent and direction, a realistic caller, changed variables, caller lines, expected route, and clear pass/fail conditions.

Name **the deciding turn**: the exact moment that proves the behavior worked. For example: “After ‘Today, anytime,’ the agent offers only slots beyond the notice period.”

Give testers simple behavior instructions: reveal details only when asked, push back once, refuse, interrupt, or go quiet. They should not invent missing facts.

Keep a small set of quick checks for every change. Before release, cover:

- Each fixed bug and an unaffected comparison case.
- Enabled and disabled settings.
- Missing numbers, empty availability, and unusable data.
- Removal requests, disclosures, verification failures, and human handoffs.
- Shared behavior across agents.

Keep date-dependent cases out of automated checks unless the clock is fixed. Listen to recordings; transcripts cannot reveal every audio problem.

## 10. Agree on disclosures and caller exits

Confirm disclosure, recording, removal, and data-retention requirements with the client and encode them into the agent.

- **AI identity:** use the agreed opening disclosure. Answer “Are you a real person?” honestly on the first ask. Unknown greeting settings must not silently remove a required disclosure.
- **Recording:** give the required notice and handle caller recording statements without derailing the call.
- **Removal requests:** recognize them anywhere in the call. Stop qualifying or pitching. If an identifier is needed, ask once, then handle the reply or silence and close without looping.
- **Distress, abuse, or legal threats:** define a polite exit or human handoff. Stop the sales questions.
- **Personal data:** configure storage, redaction, and retention for recordings, transcripts, and extracted variables.

Test these paths as carefully as booking and transfer paths.

## 11. Release and debug carefully

Keep source, tests, exports, and a readable changelog together. Use a separate branch for each change and give clients a short review document or journey diagram.

### Before release

1. Save the live configuration so you can restore it.
2. Open a draft and compare it with the published version. If the API cannot create one, use the dashboard.
3. Edit the source, build it, and check size limits.
4. Run tests, review changed snapshots, and test a real call.
5. Push to the correct objects. Read them back and compare every intended field, including the prompt and tools. A `200` response alone proves little.
6. Set a clear version title and description, then publish deliberately.
7. Read back the published version and its title. Check that call routing uses the intended version.
8. Save the published export and changelog in version control for review and rollback.

Published versions are frozen. Errors about updating a published flow or agent mean you need an editable draft. Titles may need a separate write and read-back check.

### When something goes wrong

1. Get the transcript, recording, and exact call payload.
2. Confirm the account, agent, and version that served the call.
3. Reproduce it with the shipped code and original payload.
4. Identify whether the fault is in input data, code, model behavior, transcription, or TTS.
5. Fix it, add a regression test, and record why the guard exists.

Record failed bookings, missing transfer numbers, and other incomplete outcomes in post-call fields. Give the backend team the payload, transcript, and expected value when the cause is upstream.

---

## Reference A: Reusable conversation style

Keep this block in one shared source file and include it in each agent. Customize required scripts and business promises for the client. Keep locked wording exact.

```text
VOICE AND RHYTHM
Be casual, warm, and clear. Use contractions and short sentences.
Ask one question per turn, with at most two sentences before it.
Match the caller's pace.
Usually give a short acknowledgment, then ask the question. Every second
or third turn, go straight to the question: no thanks, recap, or acknowledgment.
Do not use the same turn shape three times in a row.
Short follow-ups are fine: "The roof?" or "How about the kitchen?"
Start with the content word rather than "And" or "So."

FILLERS AND PAUSES
Use at most one natural hesitation per turn: a light filler, a doubled
word, a soft ending, or a brief pause before an important word.
Do not force a filler into every turn. End statements with periods.
Use none in hardship responses or LOCKED lines.

REFLECT MEANING
When an answer includes a feeling, history, readiness, a joke, or several
related details, reflect its meaning in one short clause before continuing.
Use your own words: "Sounds like a tight spot with the repairs and what you owe."
Do not use a stock response or read the details back as a list.

CONNECT TO EARLIER DETAILS
When useful, refer to one earlier detail in one clause.
Example: "You mentioned the roof needs work."
Only make a promise about that detail if the business can honor it.

KEEP THE CALL MOVING
Answer a caller's question briefly, then ask the next useful question.
A vague or silent opening is a cue to explain why you are calling.
Do not replay the greeting, wait on a generic "How can I help?", or loop
on "Are you still there?"

WHEN YOU CANNOT ANSWER
Do not guess, stall with "let me think," or sound certain about unknown facts.
Use a clear next step: "That's something my team can help answer."
Only promise a follow-up if the workflow can arrange it.

AVOID REPETITION
Do not repeat a delivered line in the same words or ask for answers already given.
If a question goes unanswered, reword it more briefly or move on.
The introduction counts: after "hello?" or silence, use one short re-engagement,
not the full greeting again.

QUESTIONS AND CLOSING
If you ask a question, stop and wait. Do not close or end the call on that turn.
For "ask, then exit," ask first, handle the answer or defined silence timeout,
then close. Do not restart a one-attempt step.
Use one closing line. If the caller continues, answer what they said rather
than repeating the closing.

ACKNOWLEDGMENTS
Use positive reactions only for positive news, not an address, duration,
number, or other neutral answer. Confirming a stated price is fine.
Do not use the same acknowledgment twice in a row.

MISHEARING
Rotate brief recovery lines: "Wait, I missed that," "Sorry, you cut out for
a sec," or "Sorry, and your name?"
Do not repeat the same recovery line within a call.
Do not ask again for information already clear from context. Do not guess
identity, booking, or other details that require confirmation.

OBJECTIONS
Answer the objection actually raised in one brief response, then continue
with the next relevant question. Do not answer a different scripted objection.
If the same objection comes twice, stop probing and move on.
Removal requests and other required exits override this pattern.

SPOKEN FORMATS
Use prepared spoken values from code.
Times: "2 in the afternoon," rather than reading AM/PM.
Dates: weekday, month, and day when supplied. If the weekday is missing,
omit it; do not calculate it yourself.
Prices: money words. Links: a prepared spoken form or send the link.
Do not read raw URLs, variable labels, or unresolved placeholders.

EMPATHY
For stress or urgency, briefly acknowledge the situation in your own words
and offer a real next step. Avoid stopping at "I'm sorry to hear that."
Reassure only about help the business can provide. Do not invent guarantees.
Positive life events deserve warmth and congratulations.

FAILURES AND TOOL RESULTS
Connect a failure response to what the caller just said.
Do not invent why a lookup or verification failed. Retry neutrally:
"So I have it right..." Do not reveal stored values or which check failed.
Say an action is complete only after its tool confirms success.
Explain the caller's next step, not internal nodes or flow states.
```

Why these details matter: repeated acknowledgment–question patterns sound scripted. A short reference to earlier context shows attention. Failure paths need the same care as successful calls; a false claim such as “I saved that” can be more damaging than a failed lookup.

## Reference B: JavaScript test harness and CI

The harness should load exactly one built export per agent, extract its real tool code, run it with `dv`, and freeze the clock. Do not maintain a separate copy of production logic for tests.

### Harness

Save this as `tests/harness.mjs`. It runs synchronous code tools. Since it temporarily replaces the global clock, do not run calls concurrently in the same process. Execute only trusted code from your own builds.

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const ABSENT = Symbol('absent');

export function loadTool(paths, selectCode) {
  assert.equal(paths.length, 1, 'Expected exactly one export for this agent');
  const artifact = JSON.parse(readFileSync(paths[0], 'utf8'));
  const source = selectCode(artifact);
  assert.equal(typeof source, 'string', 'Tool code is missing');
  assert.ok(source.trim(), 'Tool code is empty');
  return source;
}

export function withFrozenClock(now, fn) {
  const RealDate = globalThis.Date;
  const instant = typeof now === 'number' ? now : RealDate.parse(now);
  assert.ok(Number.isFinite(instant), 'Invalid test clock');

  function FrozenDate(...args) {
    if (!new.target) return new RealDate(instant).toString();
    return args.length ? new RealDate(...args) : new RealDate(instant);
  }
  Object.setPrototypeOf(FrozenDate, RealDate);
  FrozenDate.prototype = RealDate.prototype;
  FrozenDate.now = () => instant;
  globalThis.Date = FrozenDate;
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
}

export function run(source, base, overrides = {}, now = '2026-09-14T12:00:00Z') {
  const dv = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === ABSENT) delete dv[key];
    else dv[key] = structuredClone(value);
  }
  return withFrozenClock(now, () => new Function('dv', source)(dv));
}
```

`selectCode` is the one adapter you must implement against your actual export shape. It should find exactly one tool with the requested name and return its code body; fail on missing or duplicate tools. Pass every matching export path to `loadTool`, not just the first match.

The original harness used `null` to mean “remove this field.” This version uses `ABSENT`, so tests can distinguish an omitted field, an empty string, and a literal `null`.

### Check the harness itself

Save this as `tests/unit/harness.test.mjs`. These tests check the harness; add separate behavior tests using `loadTool` and the real exported code.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ABSENT, loadTool, run, withFrozenClock } from '../harness.mjs';

test('both clock paths freeze and the real clock is restored', () => {
  const RealDate = Date;
  const now = '2026-09-14T12:00:00Z';
  const result = run('return [Date.now(), new Date().getTime()];', {}, {}, now);
  assert.deepEqual(result, [RealDate.parse(now), RealDate.parse(now)]);
  assert.equal(Date, RealDate);
  assert.throws(() => withFrozenClock(now, () => { throw Error('failure'); }));
  assert.equal(Date, RealDate);
});

test('absent, blank, and null stay distinct without changing the fixture', () => {
  const base = { name: 'Sam' };
  const source = 'return { present: Object.hasOwn(dv, "name"), value: dv.name };';
  assert.deepEqual(run(source, base, { name: ABSENT }),
    { present: false, value: undefined });
  assert.deepEqual(run(source, base, { name: '' }), { present: true, value: '' });
  assert.deepEqual(run(source, base, { name: null }), { present: true, value: null });
  assert.deepEqual(base, { name: 'Sam' });
});

test('missing and duplicate exports fail before selection', () => {
  assert.throws(() => loadTool([], () => ''), /exactly one export/);
  assert.throws(() => loadTool(['old.json', 'new.json'], () => ''), /exactly one export/);
});
```

### Fixtures, snapshots, and mutation checks

Use one realistic baseline payload plus named overrides. Feed those same scenarios into contract checks and snapshots. Test every branch, both toggle values, malformed input, and the absence of data.

For readable snapshots:

- Store identical outputs once and reference them from scenarios.
- Store text as arrays of lines, so diffs show the changed lines.
- Show the difference near the changed character when lines are long.
- Make snapshot updates an explicit command, such as `UPDATE_SNAPSHOTS=1`. Implement this switch in the snapshot writer; Node does not provide it automatically.
- Review updates instead of editing snapshot files by hand.

On a disposable build, inject one realistic bug at a time: invert a toggle, remove the notice-period filter, or restore a suppressed value. Record which behavior test catches each bug. If only snapshots catch it, improve the behavior checks. Also confirm a harmless change passes.

Check wiring across the whole agent: variable sources, consumed sections, pre-session setup, identical shared functions, the correct prompt per agent, size limits, and configuration ranges. Mark a known live defect explicitly with its owner and removal condition; new failures must still fail CI.

### CI command

After checkout and build, run this Bash step on every pull request using the project's pinned Node version. The shell expands test paths, so this does not depend on Node's glob support. It rejects missing files, failing tests, and runs with no passing tests.

```bash
set -eu
set -- tests/unit/*.test.mjs
[ -f "$1" ] || { echo 'No unit test files found'; exit 1; }
report=$(mktemp)
trap 'rm -f "$report"' EXIT
if node --test --test-reporter=tap "$@" > "$report" 2>&1; then
  cat "$report"
else
  cat "$report"
  exit 1
fi
awk '$1 == "#" && $2 == "pass" && $3 > 0 { found = 1 }
     END { exit !found }' "$report"
```

Keep ordinary tests fast and run them with one command. Mutation checks can be a separate job. Freezing time is essential: patching only `Date.now()` leaves `new Date()` reading the real clock.

## Reference C: Retell variables and routing examples

These are configuration fragments and code bodies, not complete agent exports. Use the field locations in your actual export.

### Variables in tools and greetings

A transfer destination can use a call variable:

```json
{
  "transfer_destination": {
    "type": "predefined",
    "number": "{{transfer_phone_number}}"
  }
}
```

A scripted opening can use a prepared greeting:

```json
{ "begin_message": "{{custom_greeting_script}}" }
```

Supply these values before use. If the transfer number is absent, route to the agreed fallback and record the incomplete transfer. Do not claim a transfer succeeded.

A code tool can return both instructions and a value that replaces an existing variable:

```js
const enabled = String(dv.offer_enabled ?? '').trim().toLowerCase() === 'true';
const range = String(dv.offer_range_spoken ?? '').trim();
return {
  section_offer: enabled && range ? `Explain this offer: ${range}` : '',
  offer_range_spoken: enabled ? range : ''
};
```

Here `offer_enabled` and `section_offer` are illustrative names: map them to the real payload contract. Remove disabled values from diagnostic lines too, or they may still reach the model.

### Capture, calculate, then speak

```text
Caller gives a timezone
  -> extraction tool writes edv_timezone
  -> code reads the current value and converts valid availability
  -> code returns section_slots_local
  -> agent reads the finished list
```

If the export uses a braced extraction name, read the actual key:

```js
const zone = dv.edv_timezone || dv['{{edv_timezone}}'];
```

Define what blank means before choosing a fallback. Apply the notice-period filter to the new list and explicitly replace the old one.

### Shared verification steps

The original incident used two valid paths:

```text
One account:       first name -> surname -> ZIP -> complete
Multiple accounts: ZIP selects account -> first name -> surname -> complete
```

After the shared surname step, code decided whether ZIP was still needed. This illustrative body uses an explicit completion flag:

```js
const zipComplete = String(dv.zip_verified ?? '').trim().toLowerCase() === 'true';
return { verification_route: zipComplete ? 'done' : 'needs_zip' };
```

`zip_verified` and `verification_route` are example names. Define them in the contract before use. Only a successful ZIP check may set the flag; give it no default and clear it if the selected account changes. “Done” here means this sequence is complete, not permission to bypass other checks.

Map the returned value through `response_variables`, then configure mutually exclusive routes. Test both paths and failed ZIP checks. Capturing a ZIP is not the same as verifying it.

## Reference D: QA test-case template

Copy this for each scenario. “Deciding turn” means the original handbook's “discriminator”: the single moment that determines pass or fail.

```text
ID and title:
Agent / version / direction:
Priority / quick-check set (yes or no):
Branch or bug covered:
Baseline fixture:
Staged variables (only changes; mark absent versus blank):
Setup (clock, timezone, tools, manual steps):
Persona (situation, attitude, what to do under pressure):
Caller lines, in order:
Expected behavior:
Explicit failure conditions:
Expected route:
Deciding turn:
Example acceptable line (exact only if LOCKED):
Unaffected comparison case:
Tester notes / transcript / recording:
Known upstream defect and owner, if applicable:
```

A persona should reveal information only when asked. Give it a natural response to missing information, such as “I'd have to check.” Include interruptions, refusals, vague replies, and silence where relevant.

### Worked example: notice period

- **ID:** `SCHED-001 — exclude slots inside the notice period`.
- **Agent/direction:** the outbound booking agent; record its tested version.
- **Priority:** high; include in quick checks when time can be fixed.
- **Baseline/staging:** use the approved scheduling fixture. In its real availability field, stage slots at 12:30, 13:00, and 14:00. Use actual contract keys.
- **Setup:** fix the business clock at noon on the fixture's date, with a 60-minute notice period. This case assumes a slot exactly 60 minutes away is allowed. Use one explicit zone for all times.
- **Persona:** a cooperative caller who only gives details when asked and says “I'd have to check” for unknown facts.
- **Caller line:** when asked for availability, say “Today, anytime.”
- **Expected route:** opener → discovery → scheduling → valid-slot confirmation.
- **Deciding turn:** the first proposed appointment after that reply.
- **Pass:** the agent offers only supplied slots at 13:00 or later. Before confirming, the selected slot still meets the notice rule.
- **Fail:** it offers 12:30, invents another time, or confirms a slot that has become too soon.
- **Sample line:** “I have 1 in the afternoon available.” Exact wording is not required.
- **Comparison case:** with only the valid 14:00 slot, the agent still offers it.
- **Tester notes:** capture the transcript and payload. If the live clock cannot be fixed, stage relative times manually and exclude this case from automated quick checks.

Add separate cases for no valid slots, missing current time, changed timezone, tool failure, and the disabled-booking path. Each should change one condition from the baseline.

Avoid cases that volunteer every answer, stage dozens of unrelated fields, omit a failure condition, or silently depend on today's date. Do not invent variable names to make a case work. If an upstream defect is expected to fail, say so and name its owner.

## Reference E: Production incidents and safeguards

These examples are recorded in the original handbook. The checks below turn that history into regression coverage.

### Wrong account route

**What happened:** a number matched two accounts. Both “record found” and “needs selection” matched, and the caller was transferred before verification.

**Safeguard:** make routes exclusive and calculate exact choices in code. **Check:** zero, one, and multiple matches each take only their intended route; multiple matches must pass account selection and verification.

### Repeated or misleading announcements

**What happened:** a moved node still said it had “just” found the caller's information. Two nodes could also acknowledge the same lookup or say goodbye twice.

**Safeguard:** give each announcement one owner. After reordering, review “just,” “already,” “last,” “next,” and similar words. **Check:** listen through every affected journey, including failure branches, and count announcements and closings.

### Successful response, missing API change

**What happened:** one write returned `200` but dropped a field. Another sent tools without the updated prompt, while the release check reported success.

**Safeguard:** fetch the correct agent, LLM, or flow object after writing and compare intended fields exactly. **Check:** deliberately omit one field from a test update and confirm verification fails.

The handbook also records these published-version errors:

```text
Cannot update published conversation flow
Cannot update published agent other than version title
```

Open an editable draft before retrying. A publish request also accepted a version title without saving it; verify the title and, if needed, write it separately and read it again.

### Data vocabulary changed silently

**What happened:** `known` was not recognized alongside `fresh` and `stale`, so populated fields were asked again. Checklist keys also differed between the CRM and agent. An unrecognized `human-recorded` greeting mode skipped a disclosure.

**Safeguard:** document accepted values and aliases, reject or flag unknown values, and preserve required disclosure on unknown modes. **Check:** send every supported spelling plus an unexpected value and inspect the resulting questions and opening.

### Time conversion or filtering returned bad slots

**What happened:** a conversion tool restored slots removed by an earlier filter. Near-term slots could also become too soon before the caller confirmed them.

**Safeguard:** filter every returned list and check the notice rule before confirmation. **Check:** original and converted lists, long calls, and boundary times.

The original timezone implementation also depended on these details:

- Its US/Canadian DST rule used the second Sunday in March and first Sunday in November, switching at 2 a.m. local time. Treat this as the documented rule for supported regions, not a rule for every location.
- Calculate the offset at the appointment instant. Using the offset at midnight can be wrong later on a transition day.
- Match applicable Arizona and Saskatchewan exceptions before generic Mountain or Central labels; winter agreement can hide summer errors.
- Convert the source time to an exact instant, then format it in the target zone. Define how missing or repeated local times at DST changes are handled.

Validate supported zones and rules against a trusted reference across thousands of zone/date combinations, including both sides of transitions. Keep that verification outside the restricted code-tool runtime if it needs timezone libraries.

### Lookup announced failure before it finished

**What happened:** during a slow lookup, the agent said it could not find the account before the successful result returned.

**Safeguard:** announce the wait once, then speak the outcome only after the tool returns. **Check:** delayed success and delayed failure; neither may produce an early result claim.

### A default made a step look complete

**What happened:** a check such as `lookup_result !== ""` stayed true because the variable had a default, making the alternative branch unreachable.

**Safeguard:** use a separate completion flag with no default, written only by the completed step. **Check:** omitted and blank input must not imply completion.

This guide preserves the main engineering rules and five implementation references. It is a condensed handbook, not a complete incident archive.
