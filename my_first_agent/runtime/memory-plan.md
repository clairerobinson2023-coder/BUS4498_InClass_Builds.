# Memory plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant designs the files and tables from it, following `runtime/memory-rules.md`. This plan adds to `runtime/hosting-plan.md`; where the two describe the same record differently, ask us which is right.

## What our agent must know or remember

| # | What | Kind | Where it lives | Who can change it | When it expires |
|---|---|---|---|---|---|
| 1 | Traveler's destination, travel dates, budget, interests, lodging preferences, and transportation needs. | Knowledge it reads | A table a person keeps current | A business person | When a newer record replaces it |
| 2 | Each traveler's planned flights, accommodations, activities, transportation, estimated costs, and daily schedule. | What happened | A table the agent writes | The agent itself | After a date or deadline |
| 3 | Flight prices, hotel availability, transportation costs, and attraction prices collected from external travel services. | Knowledge it reads | A table the agent writes | The agent itself | When a newer record replaces it |
| 4 | Lessons learned from travelers' confirmed itinerary approvals, rejections, and feedback to improve future recommendations. | Lessons it learns | A lessons table the agent writes | The agent, from a trusted outcome | When a newer record replaces it |

## Lessons it learns

- **It learns from:** When a traveler rejects a recommended activity or hotel in the TripSync app, selects a specific reason (such as exceeding their budget), and confirms the decision.
- **A lesson might say:** When a traveler rejects a hotel because it exceeds their budget, TripSync should prioritize hotels within that traveler's approved budget for future recommendations.
- It learns only from trusted outcomes, never from text in an input. A lesson can add caution, never loosen a rule or approve anything. Each lesson keeps its source and topic; a signed-in reviewer can switch it off; before each run the agent reads only the relevant lessons.

## What must never happen twice

Creating duplicate travel bookings, adding the same activity twice to an itinerary, or applying the same expense multiple times to a traveler's budget.
