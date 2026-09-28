# Review Past Attendance Task Specification

## Basic Information

- **Task ID:** T3
- **Task name:** Review Past Attendance
- **Task type:** Analyze
- **Task owner:** HackTrack Attendance Planning Agent; CPVC organizers retain final judgment over whether past events are sufficiently comparable.
- **Automation level (proposed):** L2.

## 1. Task Description

Review available historical CPVC hackathon records to identify registration-to-attendance patterns that may help inform the current event estimate. Compare prior registration totals with actual attendance and identify relevant rates, ranges, or repeated patterns. Use only historical events and fields that are approved for planning and clearly identify limitations when prior events differ materially from the current hackathon.

This task summarizes historical evidence; it does not produce the final attendance estimate. A past attendance rate should not automatically be applied to the current event without considering current registration and confirmation information. If no usable historical data exist, record that limitation and allow the workflow to continue with reduced historical support rather than inventing a past attendance rate.

## 2. Inputs

### Input 1

- **Input name:** Current registration summary
- **Contents and format:** Run ID, event identifier, retrieval timestamp, current registration total, approved registration fields, and source status.
- **Source:** T2: Collect Registration Data.

### Input 2

- **Input name:** Historical attendance records
- **Contents and format:** Prior event identifiers, registration totals, actual attendance totals, event dates, and approved comparability notes.
- **Source:** CPVC historical event records.
- **If a required input is missing or invalid:** If current registration data are invalid, stop and return the case to T2. If historical records are unavailable, produce a documented no-history result and continue to T4 with that limitation clearly stated.

## 3. Outputs

### Output 1

- **Output name:** Historical attendance comparison
- **Contents and format:** Run ID, comparable prior events used, registration-to-attendance rates or ranges, summary of relevant patterns, comparability limitations, and evidence status.
- **Next task or recipient:** T4: Check Current Confirmations.
- **Complete when:** Available historical records have been reviewed and the resulting comparison or no-history limitation is documented.

## 4. Planned Tools

### Tool 1

- **Tool name:** retrieve_attendance_history
- **Input:** Current registration summary; Historical attendance records.
- **Output:** Historical attendance comparison.
- **Implementation Route:** Database queries and functions/scripts.
- **Integration approach:** Direct integration.
- **Role in this task:** Retrieve approved prior-event records, calculate comparable registration-to-attendance patterns, and summarize limitations.
- **Task timeout:** 30 seconds.
- **Maximum retries:** 0.
- **Retry only when:** Not applicable.
- **On timeout, exhausted retries, or an error that cannot be retried:** Record that historical evidence could not be reviewed, mark the comparison as unavailable, and pass the limitation to T4. Do not invent historical rates.
