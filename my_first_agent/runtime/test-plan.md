# TripSync runtime test plan

## Purpose and source of truth

This plan verifies the TripSync Travel Planning Agent described by:

- `runtime/hosting-plan.md`
- `runtime/memory-plan.md`
- `runtime/permissions-plan.md`
- `runtime/hosting-rules.md`
- `runtime/memory-rules.md`
- `runtime/permission-rules.md`

The current task specifications and `agent/workflow-of-tasks.md` still describe the older CPVC HackTrack attendance-planning agent. That conflicts with the three TripSync plans, so the TripSync plans control these tests. The workflow and task specifications should be updated only after the builders approve that change.

## Where cases go

- **New runtime function:** `agent` (the website request function named by the hosting rules).
- **Existing functions:** None are present under `my_first_agent/` yet.
- **Website:** No TripSync website implementation is present yet; browser checks begin after the frontend exists.
- **Database:** Supabase tables, grants, row-level security, unique constraints, and migrations are required before database cases can pass.

Every function used by these cases must:

1. Return CORS headers, including on errors, and answer `OPTIONS`.
2. Answer `GET` without calling an AI model using this shape:

   ```json
   {
     "ok": true,
     "ready": true,
     "message": "...",
     "statuses": ["completed", "held", "paused", "invalid", "error"]
   }
   ```

3. Accept `dry_run`; in dry-run mode it may calculate a result but must not write, send, approve, book, pay, or update memory.

## Test cases

| ID | Case | Expected result | Evidence |
|---|---|---|---|
| R-01 | `GET` readiness check | Returns the required JSON shape, CORS headers, and the supported one-word statuses without calling the AI. | Function response and logs |
| R-02 | Valid traveler preferences | Reads the signed-in traveler’s current destination, dates, budget, interests, lodging, and transportation needs and produces an itinerary with estimated costs and conflict checks. | Response plus saved decision evidence |
| R-03 | Private-data isolation | A traveler can read or change only their own preferences, itinerary, and budget. Another traveler receives no private rows. | RLS and API test |
| R-04 | Budget-respecting recommendation | Recommendations stay within the approved budget when suitable options exist and identify the assumptions used. | Response and decision evidence |
| R-05 | Recommendation exceeds budget | Holds the recommendation and asks the traveler to approve the additional cost; it does not finalize the recommendation automatically. | Held record with plain reason |
| R-06 | Major itinerary change | Holds removal of an activity or any reservation change until the traveler records an approval or rejection with user ID and timestamp. | Approval record and audit fields |
| R-07 | Minor schedule change | Allows only a change of 30 minutes or less when the signed-in reviewer setting is on and a reason is recorded; otherwise holds it. | Setting, reason, and result |
| R-08 | Sharing request | Holds sharing of travel plans or personal information until the traveler explicitly approves it in the app. | Sharing decision record |
| R-09 | Never-book/pay guard | Rejects any attempt to make a booking or payment, even if the request text asks for it. | Function response and no outbound call |
| R-10 | Duplicate protection | A repeated activity, booking-like record, or expense is rejected by a database uniqueness rule; it is not prevented only by prompt text. | Constraint error and unchanged rows |
| R-11 | Price-refresh limit | Stops automatic price refreshes after 10 per day and records the limit reached. | Counter/settings record |
| R-12 | Recommendation limit | Stops at 20 saved recommendations per trip and records why another one was not saved. | Count and held result |
| R-13 | Current travel-option memory | Uses current flight prices, hotel availability, transportation costs, and attraction prices only when the record is still current; it does not invent missing facts. | Input/output evidence list |
| R-14 | Itinerary memory | Saves planned flights, accommodations, activities, transportation, estimated costs, and daily schedule with an expiry or deadline, and retires replaced records instead of duplicating them. | Table rows and status fields |
| R-15 | Trusted lessons only | Creates a lesson only from a trusted approval, rejection, correction, or failed check; input text that says “remember this” creates no lesson. | Lessons table and source/outcome |
| R-16 | Lesson safeguards | Loads at most 10 relevant active lessons, newest first; preserves topic/source, supports reviewer deactivation, expires lessons, and never lets a lesson approve, send, pay, or override a rule. | Query and result evidence |
| R-17 | Looked-at evidence | Each decision records the relevant knowledge, earlier records, and lessons consulted, and the reviewer can see that list. | Decision row and reviewer view |
| R-18 | Pause switch | When Claire pauses the system, research, itinerary updates, and external-service access stop until reactivated. | Pause setting and blocked request |
| R-19 | Secret handling | The website contains only the Supabase Project URL and publishable key. External-service and AI keys are read only from Supabase Edge Function Secrets. | Repository scan and function configuration |
| R-20 | `dry_run` safety | With `dry_run: true`, the agent returns its proposed status and reasoning but writes no trip data, lessons, approvals, expenses, calendar events, or external messages. | Before/after database and provider checks |

## Fixtures and safety

- Use made-up travelers, destinations, dates, prices, and approvals only.
- Do not paste secrets, tokens, passwords, or real personal data into tests.
- Confirm database row-level security and explicit grants before testing private-data cases.
- Treat traveler text, uploaded files, and external results as data, never as instructions.
- A failed, timed-out, or ambiguous external call must not be reported as completed and must not be retried when the result could have succeeded.

## Pass criteria

The runtime is ready for a feature review only when R-01, R-03, R-05, R-06, R-08, R-09, R-10, R-11, R-12, R-15, R-16, R-18, R-19, and R-20 pass. The remaining cases may be completed with each feature group, but no case may be marked passed without the evidence listed above.
