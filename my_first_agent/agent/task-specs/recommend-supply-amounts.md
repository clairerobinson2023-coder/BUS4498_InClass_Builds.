# Recommend Supply Amounts Task Specification

## Basic Information

- **Task ID:** T10
- **Task name:** Recommend Supply Amounts
- **Task type:** Recommend
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain final purchasing and budget authority.
- **Automation level (proposed):** L2.

## 1. Task Description

Use the accepted attendance estimate and planning range to recommend appropriate quantities of food, drinks, and event swag. Apply organizer-approved supply-planning rules, such as quantities per attendee, buffer amounts, rounding requirements, or known inventory constraints. Show the attendance range and assumptions used so organizers can understand how each recommendation was calculated.

These recommendations support planning only. HackTrack does not place orders, spend money, or authorize purchases. Do not invent supply ratios when no approved planning rule exists. If a required food, drink, or swag planning rule is missing, request that rule from the CPVC organizer rather than producing an unsupported quantity. Each recommendation must remain traceable to the accepted attendance range and the rule used.

## 2. Inputs

### Input 1

- **Input name:** Accepted attendance planning range
- **Contents and format:** Run ID, accepted central attendance estimate, lower and upper planning bounds, uncertainty note, and organizer acceptance status when review occurred.
- **Source:** T7: Create Planning Range and, when applicable, T8: Send for Organizer Review.

### Input 2

- **Input name:** Supply planning rules
- **Contents and format:** Approved per-attendee or buffer rules for food, drinks, and swag; rounding rules; and any known inventory or organizer constraints.
- **Source:** CPVC organizer-approved planning guidance.

- **If a required input is missing or invalid:** Do not invent supply ratios. Request the missing planning rule from the CPVC event organizer or designated hackathon planning lead.

## 3. Outputs

### Output 1

- **Output name:** Supply quantity recommendations
- **Contents and format:** Run ID, recommended quantities or ranges for food, drinks, and swag, attendance range used, rule applied to each category, assumptions, and limitations.
- **Next task or recipient:** T11: Deliver Final Plan.
- **Complete when:** Each recommendation is traceable to the accepted attendance range and an approved supply rule, and no purchasing action has been taken.

## 4. Planned Tools

### Tool 1

- **Tool name:** calculate_supply_recommendations
- **Input:** Accepted attendance planning range; Supply planning rules.
- **Output:** Supply quantity recommendations.
- **Implementation Route:** Functions/scripts.
- **Integration approach:** Direct integration.
- **Role in this task:** Apply approved deterministic planning rules to the attendance range and produce transparent supply quantities.
- **Task timeout:** 20 seconds.
- **Maximum retries:** 0.
- **Retry only when:** Not applicable.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the unresolved supply-planning status and hand the case to the CPVC event organizer or designated hackathon planning lead. Do not invent quantities or continue to T11 as if recommendations were complete.
