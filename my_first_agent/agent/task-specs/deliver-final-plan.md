# Deliver Final Plan Task Specification

## Basic Information

- **Task ID:** T11
- **Task name:** Deliver Final Plan
- **Task type:** Deliver
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain responsibility for acting on the final planning information.
- **Automation level (proposed):** L1.

## 1. Task Description

Assemble the completed attendance-planning results into one final package for CPVC organizers. Include the estimated number of attendees, attendance planning range, recommended food, drink, and swag quantities, important assumptions, uncertainty, and any organizer-review outcome that materially affected the result.

The task communicates completed planning information but does not make purchases or automatically change event plans. Do not present a partial or unresolved result as final. If an estimate, planning range, supply recommendation, or required review remains incomplete, return the issue to the responsible upstream task instead of delivering the package as successfully completed. Delivery must be recorded so T12 can verify that the workflow has actually reached its completion condition.

## 2. Inputs

### Input 1

- **Input name:** Supported final attendance result
- **Contents and format:** Run ID, event identifier, accepted attendance estimate, supporting factors, uncertainty note, accepted planning range, and organizer-review status when applicable.
- **Source:** T6: Estimate Attendance and T7: Create Planning Range, including T8 review status when applicable.

### Input 2

- **Input name:** Supply quantity recommendations
- **Contents and format:** Recommended food, drink, and swag quantities or ranges, rules used, assumptions, and limitations.
- **Source:** T10: Recommend Supply Amounts.

- **If a required input is missing or invalid:** Do not deliver a partial package as final. Return the missing component to its producing task or hand the unresolved case to the CPVC event organizer.

## 3. Outputs

### Output 1

- **Output name:** Final attendance planning package
- **Contents and format:** Run ID, event identifier, estimated attendees, planning range, food recommendation, drink recommendation, swag recommendation, assumptions, uncertainty, organizer-review note when applicable, and generation timestamp.
- **Next task or recipient:** CPVC event organizer; then T12: End Workflow.
- **Complete when:** The complete package is delivered once to the intended organizer and delivery status is recorded.

## 4. Planned Tools

### Tool 1

- **Tool name:** deliver_planning_package
- **Input:** Supported final attendance result; Supply quantity recommendations.
- **Output:** Final attendance planning package.
- **Implementation Route:** File operations plus web API calls or approved messaging integration.
- **Integration approach:** Direct integration.
- **Role in this task:** Assemble the final package from completed upstream outputs and deliver it to the designated organizer without changing the approved content.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 1.
- **Retry only when:** Delivery clearly failed before provider acceptance. Use the run ID as an idempotency key to prevent duplicate delivery. If delivery status is uncertain, do not resend automatically.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the undelivered or uncertain status and hand the package to the CPVC event organizer or designated hackathon planning lead through an alternate approved channel. Do not route to T12 as successfully delivered.
