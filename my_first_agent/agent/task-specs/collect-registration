# Collect Registration Data Task Specification

## Basic Information

- **Task ID:** T2
- **Task name:** Collect Registration Data
- **Task type:** Retrieve
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain authority over approved registration sources and event-planning decisions.
- **Automation level (proposed):** L1.

## 1. Task Description

Retrieve the current registration information for the hackathon identified in T1. Use the approved registration source to obtain the current number of registered participants and any non-sensitive registration information permitted for attendance planning. Record the source and retrieval time so later tasks can determine how current the information is.

This task collects evidence but does not decide how many registrants are likely to attend. It must not use sensitive personal information or substitute unavailable registration data with assumptions. If the event cannot be found, the registration source is unavailable, or the required registration total cannot be verified, record the unresolved status and send the case to the CPVC organizer or designated planning lead rather than continuing as though valid registration information was collected.

## 2. Inputs

### Input 1

- **Input name:** Validated attendance-estimate request
- **Contents and format:** Run ID, event identifier, event date if available, organizer request, planning scope, and validation status.
- **Source:** T1: Start Attendance Estimate.
- **If a required input is missing or invalid:** Stop the task and return the case to T1 or the CPVC organizer for correction. Do not retrieve data for an unidentified event.

## 3. Outputs

### Output 1

- **Output name:** Current registration summary
- **Contents and format:** Run ID, event identifier, retrieval timestamp, total registered participants, approved non-sensitive registration fields needed for attendance planning, and data-source status.
- **Next task or recipient:** T3: Review Past Attendance.
- **Complete when:** The current registration total and source status are recorded for the correct event.

### Output 2

- **Output name:** Registration-data exception
- **Contents and format:** Run ID, event identifier, missing source or retrieval error, status, and required follow-up.
- **Next task or recipient:** CPVC event organizer or designated hackathon planning lead.
- **Complete when:** The failure is recorded and downstream attendance analysis is stopped for the affected run.

## 4. Planned Tools

### Tool 1

- **Tool name:** retrieve_registration_data
- **Input:** Validated attendance-estimate request.
- **Output:** Current registration summary; Registration-data exception when unresolved.
- **Implementation Route:** Database queries or web API calls to the approved registration source.
- **Integration approach:** Direct integration.
- **Role in this task:** Retrieve the current registration total and approved planning fields for the target event.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 1.
- **Retry only when:** A temporary read, connection, or rate-limit error prevents retrieval. Retry once after a short delay. Do not retry when the event identifier is invalid or the source does not contain the required event.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the failure in Registration-data exception and hand the case to the CPVC event organizer or designated hackathon planning lead. Do not continue to T3 as if registration data were available.
