# Permissions and boundaries plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant builds it following `runtime/permission-rules.md`. Where this plan and our task specifications disagree, this plan wins.

- Agent: The TripSync Travel Planning Agent collects travelers’ preferences, compares flights, hotels, transportation, and activities, and creates a personalized itinerary within their budget. It also tracks estimated costs, identifies scheduling conflicts, and recommends adjustments when plans or preferences change. (`my_first_agent`)
- Owner, who answers for this agent: Claire
- Written on: November 8, 2026

## 1. May (on its own)

| # | Action |
|---|---|
| 1 | Things the agent can do without asking permission. - Research and compare flights, hotels, restaurants, and attractions. - Create personalized travel itineraries based on user preferences. - Calculate estimated travel expenses and identify scheduling conflicts. - Suggest alternative activities or accommodations. |

## 2. May, with a limit

| # | What | The limit | Kind | Who can change it |
|---|---|---|---|---|
| 1 | Update estimated travel costs | Up to 10 automatic price refreshes per day | Fixed: only the builders change it | Only the builders, by changing the code |
| 2 | Adjust itinerary schedules | Only minor scheduling changes of 30 minutes or less | A switch a reviewer can flip in the app | A signed-in reviewer, in the app, with a reason |
| 3 | Save travel recommendations | Maximum 20 recommendations per trip | A switch a reviewer can flip in the app | A signed-in reviewer, in the app, with a reason |

## 3. Ask first (hold for a person)

| # | When | What the agent does instead |
|---|---|---|
| 1 | A major itinerary change is needed, such as removing an activity or changing a reservation | Holds the change for the traveler to approve or reject in the app |
| 2 | A recommended flight, hotel, or activity exceeds the traveler's budget | Pauses the recommendation and asks the traveler to approve the additional cost |
| 3 | The agent needs to share travel plans or personal information with another person | Holds the action until the traveler explicitly approves sharing in the app |

## 4. Never

| # | Never | Where it is enforced |
|---|---|---|
| 1 | Make travel bookings or payments on behalf of travelers | Code |
| 2 | Access or modify another traveler's private itinerary or personal information | A database rule |
| 3 | Create duplicate bookings or charge the same travel expense twice | A database rule |

## 5. Who signs off

| Decision | Who | How |
|---|---|---|
| Major itinerary changes, including adding or removing activities | The traveler | Approval or rejection in the app, recorded with user ID and timestamp |
| Sharing travel itineraries with other people | The traveler | User confirms sharing in the app; decision is saved |
| Adding calendar events to the traveler's calendar | The traveler | User approves in the app; approval is logged |

## The off switch

The TripSync system owner (Claire) can pause the agent using a Pause button in the app. When paused, the agent stops researching travel options, updating itineraries, and accessing external services until the owner reactivates it.

## How mistakes are reported

Travelers can report incorrect travel prices, scheduling conflicts, or unwanted itinerary changes using a Report Issue button in the app. The TripSync system owner (Claire) reviews these reports, corrects errors, and records the resolution to prevent similar mistakes in the future.

## Rules we keep

- Every permission starts off. The agent may do only what this plan lists under *May* and *May, with a limit*.
- Writing a permission down does not enforce it. Every limit and every *Never* is enforced in code or in a database rule, never in instructions alone.
- A limit a person may change is a setting with an owner and a reason, which the code reads on every run.
- Asking means holding, not guessing: the record waits with a plain reason that names what is missing.
- A sign-off is a click in the app, recorded with who and when. A chat message is not a sign-off.
- Test mode never acts: with `dry_run`, the agent decides but saves nothing.
