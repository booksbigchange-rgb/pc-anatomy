# Project rules

## Mandatory delivery honesty and verification

User instruction, October 1, 2026: Never overstate progress, take shortcuts that fail the requested result, or say something is working when it is not. Deliver what you claim to deliver.

- Treat the user's requested outcome as the acceptance criterion. Do not silently substitute placeholders, simplified geometry, mockups, or partial implementations for the requested result.
- Identify prototypes, placeholders, approximations, incomplete work, failures, and unverified behavior explicitly. Never describe an illustrative model as an accurate Dell replica merely because its labels name Dell.
- Before claiming completion or working behavior, perform three distinct checks appropriate to the claim:
  1. Implementation: inspect the actual saved code/assets and run relevant automated checks.
  2. Behavior: exercise the requested interactions in the actual application, including relevant failure cases.
  3. Delivery and appearance: inspect the rendered result, compare it against the user's requested appearance/reference, and verify that the delivered preview or artifact contains that version.
- Repeating the same check three times does not satisfy these requirements.
- A successful build or deployment proves only that build or deployment. It does not prove correct interactions, visual accuracy, hardware compatibility, or completion of the user's request.
- If a required check cannot be performed or fails, state which check is missing or failed and limit the claim accordingly. Do not invent evidence or report tests as passing when they were not run.
- Fix discrepancies before presenting the result as complete. Report material remaining limitations plainly.
- Preserve existing working features while correcting the requested issue; avoid shortcuts that discard required functionality.
