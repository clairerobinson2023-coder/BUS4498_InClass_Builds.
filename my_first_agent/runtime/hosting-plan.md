# Hosting plan

Written in plain words with the BUS 4498 Agent Builder Kit. Our AI assistant turns it into a GitHub Pages website and a Supabase backend, following `runtime/hosting-rules.md`. Where this plan and our task specifications disagree, this plan wins.

## Our project

- GitHub repository: https://github.com/clairerobinson2023-coder/BUS4498_Team_Build
- Our agent’s folder: `my_first_agent` (our plans are in `my_first_agent/runtime/`)
- Supabase project: https://sccwjompjfgvenqyvuhs.supabase.co
- Owner of the repository and the Supabase project: Claire
- Teammate: Afreen, a collaborator on GitHub and a Developer in the Supabase organization
- We say “I’m working on it” and “pushed” in: iMessage. One of us works at a time.

## What our agent does

The TripSync Travel Planning Agent collects travelers’ preferences, compares flights, hotels, transportation, and activities, and creates a personalized itinerary within their budget. It also tracks estimated costs, identifies scheduling conflicts, and recommends adjustments when plans or preferences change.

## Our tasks

Use the tasks in our task specifications: `my_first_agent/agent/workflow-of-tasks.md` and `my_first_agent/agent/task-specs/`.

## Who can see or change what

Travelers can view and edit their own trip preferences, itineraries, and budgets. Only authorized users can access or modify shared trip plans, and the agent can recommend changes but requires user approval before finalizing bookings or major itinerary adjustments.

## External tools and applications

| # | Tool or application | What the agent uses it for | What it does with it | Most sensitive data it touches | How it connects |
|---|---|---|---|---|---|
| 1 | Google Maps | Finds attractions, restaurants, travel distances, and transportation routes to create realistic daily itineraries. | Reads from it | Confidential | An API key (in Supabase Secrets) |
| 2 | Google Flights | Searches and compares flight options, prices, airlines, and departure times based on the traveler's preferences. | Reads from it | Confidential | An API key (in Supabase Secrets) |
| 3 | Booking.com | Compares hotels and accommodations based on location, price, availability, and traveler preferences. | Reads from it | Confidential | An API key (in Supabase Secrets) |
| 4 | Google Calendar | Adds planned activities and travel reservations to the traveler's calendar to help prevent scheduling conflicts. | Reads from it | Confidential | A sign-in (OAuth) |
| 5 | Google Sheets | Organizes travel expenses, tracks the overall budget, and records estimated costs for flights, lodging, transportation, and activities. | Reads from it | Confidential | A sign-in (OAuth) |

## Files people upload

None.
