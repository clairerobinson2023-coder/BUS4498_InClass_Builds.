# Estimate Attendance Task Specification

```yaml
# BASIC INFORMATION
task_id: "T6"
task_name: "Estimate Attendance"
task_owner: "Claire"

# Agent Inference Configuration
Provider: [e.g., Groq, OpenAI, Claude, Google Gemini]
Model: "[Exact supported API model ID.]"
Role: [permitted subtasks the model supports]
Maximum inference requests per task run: "[Whole-number limit.]"
On inference failure or exhausted limits: Record the unresolved status and hand the case to [human role].
```

## 1. Task Goal

- **Objective:** Estimate the most likely number of students who will actually attend the hackathon so CPVC organizers can make better decisions about food, drinks, swag, and other event resources.

## 2. Inbound Inputs

*Describe what the enclosing workflow must provide. Specify the structure of each input; do not invent customer, employee, or event data. Copy the Input block as needed.*

### Input 1

- **Input name:** Current Registration Data
- **What it contains:** The current number of registered participants and any available registration details relevant to attendance planning.
- **Source:** The earlier workflow task that collects or reviews hackathon registration data.

### Input 2

- **Input name:** Attendance Response Summary
- **What it contains:** A structured summary of participant attendance responses, such as confirmed, declined, or uncertain statuses, when those responses are available in the workflow.
- **Source:** The workflow task responsible for collecting or updating attendance responses.


## 3. Tool Permissions and Boundaries


*Copy the Tool block as needed. Tool-specific and task-wide limits both apply; stop at whichever is reached first. Naming a tool does not authorize uses outside its stated permissions.*



## 4. How the Agent Should Reason

*Define permitted kinds of work rather than a fixed sequence. The agent selects its next subtask using intermediate findings and may skip, repeat, or combine permitted subtasks within Section 3's limits. Individual subtasks do not all have to be L3. Copy the Permitted Subtask block as needed.*

### Permitted Subtask 1

- **Subtask name:** Review registration signals
- **Subtask description:** Examine the available registration and attendance-response information to identify patterns that may affect expected turnout, such as how many participants are confirmed, declined, or uncertain.
- **Subtask boundary:** May only use registration and response information already provided by the workflow; may not contact participants, change registration records, or create missing data.
- **Retry limits:** 1 additional attempt if the available information is incomplete or inconsistent.

- **Decision guidance:** After each subtask, use its findings to select the permitted subtask most likely to resolve the most important remaining uncertainty. Do not follow a fixed sequence. If no permitted subtask can make useful progress, stop and hand the case to a person.

## 5. When to Stop or Hand Off to a Human

- **Stop successfully when:** The task has produced a final attendance estimate supported by the available registration information, attendance-response data, and any historical attendance evidence provided to the workflow, with the main factors affecting the estimate and any remaining uncertainty clearly documented.
- **Hand off early when:** Required input data is missing, conflicting, or too incomplete to support a reasonable estimate; repeated attempts do not resolve inconsistencies; or the task encounters a situation outside its permitted scope, such as needing to contact participants, change registration records, or make purchasing decisions.
- **Hand off to:** CPVC event organizer or designated hackathon planning lead responsible for attendance and event-resource decisions.

Stop at the first applicable budget limit or handoff condition. While awaiting review, take no further autonomous action.

## 6. Outbound Deliverable

*Revise these default items if your task needs a more specific deliverable, or retain them if they fit.*

- **Status:** Completed or escalated to human.
- **Result or recommendation:** The completed result. If escalated before reaching a supported result, write undetermined.
- **Evidence summary:** The most important evidence supporting the result or explaining why no result could be reached.
- **Subtasks performed:** Permitted subtasks completed, including repeated attempts.
- **Unresolved issues:** Remaining uncertainties or questions; use none only if no unresolved issue remains.
- **Handoff note:** Reason for stopping, unresolved questions, and what the reviewer needs to decide; write "Not applicable" for a completed task.
- **Next task or recipient:** Who receives the completed output? Unresolved cases go to the handoff recipient above.
