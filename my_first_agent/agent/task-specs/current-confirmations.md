# Check Current Confirmations Task Specification

## Basic Information

- **Task ID:** T4
- **Task name:** Check Current Confirmations
- **Task type:** Check
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain authority over approved participant communication and confirmation methods.
- **Automation level (proposed):** L1.

## 1. Task Description

Check whether approved voluntary confirmation signals or other permitted attendance indicators are available for the current hackathon. Combine those signals with the current registration summary and historical attendance comparison to determine whether the attendance-estimation evidence is sufficiently complete to continue to T6.

A lack of participant confirmations is not the same as evidence that registered participants will not attend. Record whether confirmation information is available, how many participants it represents, and any limitations in its coverage. If material information that an organizer can reasonably provide is missing, route the case to T5 rather than treating missing information as a negative attendance signal. If the available evidence is sufficient, package it for T6: Estimate Attendance.

## 2. Inputs

### Input 1

- **Input name:** Current registration summary
- **Contents and format:** Run ID, event identifier, current registration total, approved registration fields, and source status.
- **Source:** T2: Collect Registration Data.

### Input 2

- **Input name:** Historical attendance comparison
- **Contents and format:** Comparable prior events, attendance-rate patterns or ranges, limitations, and evidence status.
- **Source:** T3: Review Past Attendance.

### Input 3

- **Input name:** Current confirmation signals
- **Contents and format:** Approved voluntary confirmations or equivalent non-sensitive attendance signals, including count, timestamp, source, and coverage limitations. A valid empty result is allowed when no confirmation collection exists.
- **Source:** Approved CPVC confirmation source.

- **If a required input is missing or invalid:** Route missing or unclear organizer-answerable information to T5: Request Additional Input. If the registration summary itself is invalid, return the case to T2.

## 3. Outputs

### Output 1

- **Output name:** Attendance evidence package
- **Contents and format:** Run ID, current registration summary, historical attendance comparison, current confirmation signals, evidence-completeness status, and noted limitations.
- **Next task or recipient:** T6: Estimate Attendance when evidence is sufficient; T5: Request Additional Input when organizer-supplied information is needed.
- **Complete when:** The available evidence is packaged and its completeness status is explicit.

## 4. Planned Tools

### Tool 1

- **Tool name:** retrieve_confirmation_signals
- **Input:** Current registration summary; Historical attendance comparison.
- **Output:** Attendance evidence package.
- **Implementation Route:** Database queries or web API calls to an approved confirmation source.
- **Integration approach:** Direct integration.
- **Role in this task:** Retrieve current approved confirmation signals and combine them with registration and historical evidence for the readiness check.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 1.
- **Retry only when:** A temporary source-read or connection failure prevents retrieval. Retry once after a short delay.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record the confirmation source as unavailable. If the remaining evidence is sufficient, continue with the limitation recorded; otherwise route the case to T5 or the CPVC event organizer. Do not treat unavailable confirmations as confirmed attendance.
