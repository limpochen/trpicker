# Behavioral Constraints

## 1. Think Before You Code

**Don't assume. Don't hide confusion. Put trade-offs on the table.**

Before implementing:

- State your assumptions explicitly. If you are unsure, ask.
- If there are multiple interpretations, raise them all — don't silently pick one.
- If there is a simpler approach, say so. Push back when reasonable.
- If something is unclear, stop. Point out what is confusing, then ask.

## 2. Minimalism First

**Write the least code needed to solve the problem. No speculative code.**

- Don't implement features beyond what was asked for.
- Don't create abstractions for code used only once.
- Don't add unrequested "flexibility" or "configurability".
- Don't write error handling for scenarios that can't happen.
- If you wrote 200 lines that could have been 50, rewrite it.

Ask yourself: "Would a senior engineer find this over-engineered?" If so, simplify.

## 3. Surgical Changes

**Change only what must change. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match the existing code style, even if you would write it differently.
- If you notice unrelated dead code, mention it — but don't delete it.

When your change creates orphaned code:

- Remove imports/variables/functions made unused **by your change**.
- Don't delete pre-existing dead code unless asked.

Test: every changed line should trace directly back to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until they are met.**

Turn tasks into verifiable goals:

- "Add validation" → "write tests for invalid input, then make them pass"
- "Fix this bug" → "write a reproducing test, then make it pass"
- "Refactor X" → "ensure tests pass before and after"

For multi-step tasks, state a short plan:

```
1. [Step] → Verify: [Check]
2. [Step] → Verify: [Check]
3. [Step] → Verify: [Check]
```

Strong success criteria let you iterate independently. Weak ones ("just make it good") require constant clarification.

# Project-Specific Constraints & Guidelines

#### Version Bumping

* Every bug fix and line-level code adjustment bumps the version by 0.0.1 (e.g. 1.0.0 → 1.0.1).
* Every feature enhancement and module-level adjustment bumps the version by 0.1.0 (e.g. 1.0.0 → 1.1.0), but requires authorization to bump.
* Every breaking change bumps the major version by 1 (e.g. 1.0.0 → 2.0.0), but requires authorization to bump.

#### Fine Slider (Rate Wheel)

* A slim vertical bar shown after clicking a handle.
* Drag speed determines the step rate: fast drag = fast stepping, slow drag = slow stepping.
* Drag up = increase, drag down = decrease.
* Use `APPEARANCE.fineSlider.sensitivity` to control sensitivity (pixels/step).
* Wheel behavior is unchanged; each step = stepMinute.
* `trpicker-fine-slider.js` owns all the logic.
* Colors follow the selected handle color.

#### Code Comments & Commit Messages

* Write all code comments in English.
* Write all git commit messages in English.
* Use a concise, imperative style with Conventional Commits prefixes: `feat:` / `fix:` / `refactor:` / `chore:` / `docs:` (e.g. `feat: add ESM build output`, `fix: correct handle snapping on 12H mode`).
* Use the initial commit for first-time history: `Initial commit: ...`.
* Keep comments focused on the "why" of non-obvious logic, not the "what".

#### Documentable Comments (JSDoc)

* Use JSDoc (`/** ... */`) for every public API surface so documentation can be generated: the class, constructor options, public methods, public properties, callbacks, and static members.
* Document parameters and return values with `@param` / `@returns`; describe option shapes with `@param {Object} options`.
* Mark deprecated APIs with `@deprecated` and point to the replacement.
* Keep JSDoc accurate: update it when the code changes, and never copy a doc block that describes something else.

