# Create Planning Range Task Specification

## Basic Information

- **Task ID:** T7
- **Task name:** Create Planning Range
- **Task type:** Calculate
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain final authority over how conservatively to plan supplies.
- **Automation level (proposed):** L2.

## 1. Task Description

Convert the supported attendance estimate produced by T6 into a practical lower and upper planning range that CPVC organizers can use for event preparation. Apply the approved range rule consistently to the central estimate and its documented uncertainty so the resulting range reflects realistic variation instead of presenting one number as certain.

This task does not change the central attendance estimate and does not authorize purchases. The lower and upper bounds must remain traceable to the T6 estimate and the uncertainty associated with it. If the estimate is too uncertain, unsupported, or outside the range where the planning rule can be applied reliably, do not create an artificial range. Route the result to T8 for organizer review.

## 2. Inputs

### Input 1

- **Input name:** Supported attendance estimate
- **Contents and format:** Run ID, event identifier, estimated attendees, supporting factors, uncertainty status, and evidence references from T6.
- **Source:** T6: Estimate Attendance.

- **If a required input is missing or invalid:** Do not calculate a planning range. Return the unresolved estimate to T6 or route it to T8 for organizer review when uncertainty or evidence is the issue.

## 3. Outputs

### Output 1

- **Output name:** Attendance planning range
- **Contents and format:** Run ID, central estimate, lower planning bound, upper planning bound, rule used, uncertainty note, and source estimate reference.
- **Next task or recipient:** T10: Recommend Supply Amounts when the result is accepted; T8: Send for Organizer Review when human review is required.
- **Complete when:** Both bounds are calculated from the supported estimate, are internally consistent, and the uncertainty note is included.

## 4. Planned Tools

### Tool 1

- **Tool name:** calculate_planning_range
- **Input:** Supported attendance estimate.
- **Output:** Attendance planning range.
- **Implementation Route:** Functions/scripts.
- **Integration approach:** Direct integration.
- **Role in this task:** Apply the approved deterministic range rule to the T6 attendance estimate and documented uncertainty.
- **Task timeout:** 15 seconds.
- **Maximum retries:** 0.
- **Retry only when:** Not applicable.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the calculation failure and hand the case to the CPVC event organizer or designated hackathon planning lead through T8. Do not invent a planning range.
