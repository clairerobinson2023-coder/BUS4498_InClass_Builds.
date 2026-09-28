# Request Additional Input Task Specification

## Basic Information

- **Task ID:** T5
- **Task name:** Request Additional Input
- **Task type:** Communicate
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers decide whether and how to provide additional information.
- **Automation level (proposed):** L1.

## 1. Task Description

Request a limited amount of additional information when T4 identifies a material gap that prevents a useful attendance estimate. State exactly what information is missing and why it matters to the estimate. Direct the request to the CPVC organizer or designated planning lead whenever the missing fact is organizer-owned.

The task should minimize unnecessary communication and must not request sensitive personal information. It should not contact participants unless participant confirmation is specifically approved by organizers and necessary for the workflow. A request is not evidence that the missing fact has been resolved. Continue only after the additional information has been received and recorded, then return the updated evidence to T4 for another completeness check.

If the request cannot be delivered or the organizer cannot provide the needed information, record the unresolved status and do not continue as if the missing evidence exists.

## 2. Inputs

### Input 1

- **Input name:** Attendance evidence package
- **Contents and format:** Run ID, registration evidence, historical attendance comparison, current confirmation signals, evidence-completeness status, and the specific missing or unclear information that prevents a useful estimate.
- **Source:** T4: Check Current Confirmations.

- **If a required input is missing or invalid:** Do not send a vague or unsupported request. Return the case to T4 for a specific missing-information statement.

## 3. Outputs

### Output 1

- **Output name:** Additional-input request
- **Contents and format:** Run ID, event identifier, exact information requested, reason the information is needed, intended recipient, response destination, and communication status.
- **Next task or recipient:** CPVC event organizer or designated hackathon planning lead.
- **Complete when:** The request is recorded and delivered once to the intended organizer, or an exception is recorded.

### Output 2

- **Output name:** Organizer-provided additional input
- **Contents and format:** Run ID, event identifier, organizer response, source, timestamp, and any stated limitations or uncertainty.
- **Next task or recipient:** T4: Check Current Confirmations.
- **Complete when:** The organizer response is recorded and can be rechecked by T4.

## 4. Planned Tools

### Tool 1

- **Tool name:** send_input_request
- **Input:** Attendance evidence package.
- **Output:** Additional-input request.
- **Implementation Route:** Web API calls or approved messaging integration.
- **Integration approach:** Direct integration.
- **Role in this task:** Send one bounded organizer-facing request for the exact missing information identified by T4.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 1.
- **Retry only when:** Delivery clearly failed before the message was accepted by the provider. Use the run ID and request ID to avoid duplicate messages. If delivery outcome is uncertain, do not resend automatically.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the unsent or uncertain delivery status and hand the case to the CPVC event organizer or designated hackathon planning lead. Do not claim the request was delivered.

### Tool 2

- **Tool name:** record_organizer_input
- **Input:** Additional-input request.
- **Output:** Organizer-provided additional input.
- **Implementation Route:** File operations or database record update.
- **Integration approach:** Direct integration.
- **Role in this task:** Record the organizer response and attach it to the correct attendance-planning run for rechecking by T4.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 1.
- **Retry only when:** A temporary write failure occurs and there is clear evidence that the first write did not succeed. Do not retry if record status is uncertain.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the uncertain persistence status when possible and hand the case to the CPVC event organizer or designated hackathon planning lead. Do not continue to T4 as if the response were safely recorded.
