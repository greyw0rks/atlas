# ATLAS
## Documents 31–40: Auto-Fire, Multi-Agent Continuity, Repository Onboarding, Timeline Intelligence, Intent, Proactive Intelligence, Memory Quality, Offline Mode, CLI, and Final Launch Architecture

**Project:** Atlas  
**Documents:** 31–40  
**Status:** Product + Technical Specification  
**Version:** 1.0

---

# Document 31: Atlas Auto-Fire & Terminal Shell Integration

## 31.1 Purpose

Auto-fire is one of Atlas's defining product experiences.

The developer should not need to remember to launch Atlas.

Atlas should appear naturally when the developer starts a supported coding agent.

The intended workflow is:

```bash
claude
```

or:

```bash
codex
```

and Atlas automatically activates around the session.

## 31.2 Core Principle

Atlas should feel like part of the terminal environment, not another application the developer must remember to open.

The user should not have to do:

```bash
atlas
claude
```

unless they explicitly want to.

## 31.3 Shell Integration

Atlas can integrate through supported shell mechanisms such as:

```text
Shell startup configuration
Shell functions
Shell aliases/wrappers
PATH resolution
Agent launchers
Local background runtime
```

The implementation should choose the least fragile approach for each supported environment.

## 31.4 Supported Shells

Initial targets:

```text
Bash
Zsh
PowerShell
```

Additional shells can be supported later.

## 31.5 Supported Agents

Initial:

```text
Claude Code
Codex
```

Future architecture should allow:

```text
Other terminal coding agents
```

without rebuilding the memory system.

## 31.6 Intercepting Agent Startup

Conceptually:

```text
User types:
claude

       ↓

Atlas launcher

       ↓

Detect environment

       ↓

Prepare context

       ↓

Launch real Claude Code
```

The developer should still interact with Claude Code normally.

## 31.7 Codex

Same concept:

```text
User types:
codex

       ↓

Atlas launcher

       ↓

Prepare context

       ↓

Launch Codex
```

## 31.8 Startup Context

Atlas should display a compact startup panel:

```text
ATLAS ✓

WELCOME BACK

Project:
Atlas

Current focus:
Memory retrieval

Open:
→ Ranking tests
→ Retrieval evaluation

Important:
Hybrid retrieval is preferred.

Context ready.
```

## 31.9 No Repository

The developer may run:

```bash
cd ~
claude
```

Atlas should not fail.

It should display:

```text
ATLAS

No repository detected.

General workspace mode enabled.
```

## 31.10 Directory Change

The developer may then type:

```bash
cd ~/projects/atlas
```

Atlas detects the repository.

The context changes:

```text
ATLAS

Project detected:
Atlas

Loading project context...
```

## 31.11 Nested Repositories

Atlas should identify the most relevant repository based on the current directory.

Example:

```text
~/projects
   ├── atlas
   └── other-project
```

Entering either directory changes project context.

## 31.12 Multiple Workspaces

Atlas should distinguish:

```text
Project
Repository
Workspace
Branch
```

## 31.13 Startup Latency

Atlas must avoid making users wait for AI processing.

Preferred:

```text
Cached context
      ↓
Immediate display
      ↓
Fresh retrieval in background
```

## 31.14 Failure Behavior

If Atlas crashes:

```text
Claude Code / Codex
```

must continue launching.

Atlas must never become a single point of failure for development.

## 31.15 Disable

Users should be able to disable auto-fire:

```bash
atlas config set auto_fire false
```

## 31.16 Manual Mode

Users can still launch:

```bash
atlas
```

for direct inspection.

---

# Document 32: Atlas Multi-Agent Continuity Engine

## 32.1 Purpose

Atlas must provide one persistent memory layer across multiple coding agents.

The memory belongs to the developer and project, not to Claude Code or Codex.

## 32.2 Architecture

```text
             Atlas Memory
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   Claude Code             Codex
        │                   │
        └─────────┬─────────┘
                  ▼
             Same Project
               Context
```

## 32.3 Example

Monday:

```text
claude
```

Developer works on authentication.

Tuesday:

```text
codex
```

Developer continues the same project.

Atlas retrieves Monday's relevant context.

## 32.4 Agent-Agnostic Memory

Stored memory should not be shaped as:

```text
Claude memory
```

Instead:

```text
Project memory
Session memory
Developer memory
```

## 32.5 Agent Metadata

Atlas can record:

```text
agent_name
agent_version
session_id
```

This is useful for analytics and debugging, but should not fragment the underlying memory.

## 32.6 Agent Handoffs

Example:

```text
Claude Code
     ↓
Atlas
     ↓
Session handoff
     ↓
Codex
```

The handoff includes:

```text
Current task
Completed work
Important decisions
Open problems
Relevant files
Next recommended step
```

## 32.7 Agent-Specific Context

Some instructions may need agent-specific formatting.

Atlas should have adapters:

```text
Atlas Core
   ├── Claude Adapter
   └── Codex Adapter
```

## 32.8 Future Agents

Adding another agent should mean implementing:

```text
New adapter
```

rather than rebuilding Atlas.

---

# Document 33: Atlas Intelligent Repository Onboarding

## 33.1 Purpose

When Atlas encounters a repository for the first time, it should immediately begin understanding it.

The developer should not need to manually explain the project.

## 33.2 New Repository

Example:

```bash
cd ~/projects/new-app
claude
```

Atlas detects:

```text
NEW PROJECT
```

## 33.3 Initial Scan

Atlas identifies:

```text
Repository
Language
Framework
Package manager
README
Documentation
Main directories
Configuration
Tests
Build system
```

## 33.4 Initial Project Map

Example:

```text
NEW PROJECT

new-app

Detected:

TypeScript
Next.js
PostgreSQL
Docker

Main areas:

src/
components/
api/
db/
tests/
```

## 33.5 Documentation

Atlas should inspect useful documentation such as:

```text
README.md
docs/
CONTRIBUTING.md
ARCHITECTURE.md
```

It should not blindly ingest every file.

## 33.6 Initial Memory

Atlas creates a small initial project profile:

```text
Project purpose
Technology stack
Architecture hints
Important commands
Documentation locations
```

## 33.7 Avoiding Over-Indexing

The initial scan should be efficient.

Atlas should not send the entire repository to an AI model.

Use:

```text
Deterministic metadata
Selective file reading
Targeted AI analysis
```

## 33.8 Existing Atlas Documentation

If:

```text
ATLAS.md
```

exists, treat it as a high-value project context source, subject to validation.

## 33.9 Onboarding Completion

After processing:

```text
ATLAS ✓

Project understood.

Initial context created.

You can start coding.
```

## 33.10 Background Enrichment

More detailed analysis can happen after the agent starts.

---

# Document 34: Atlas Developer Timeline & "What Happened?" Engine

## 34.1 Purpose

Atlas should reconstruct project history in a way humans can understand.

Instead of browsing hundreds of commits and chats, the developer can ask:

```text
What happened to this project last week?
```

## 34.2 Timeline Sources

Atlas can combine:

```text
Sessions
Commits
Tasks
Decisions
Memories
File changes
Handoffs
Documentation updates
```

## 34.3 Timeline

Example:

```text
AUG 12
Authentication tests added

AUG 11
Session storage redesigned

AUG 10
Database migration completed

AUG 08
Previous authentication approach abandoned
```

## 34.4 Natural-Language Reconstruction

User:

> What changed in authentication this week?

Atlas should produce:

```text
Authentication changed in three major steps:

1. The old token flow was removed.
2. Server-side sessions were introduced.
3. Integration tests were added.

The current implementation is server-side sessions.
```

## 34.5 Historical Context

Atlas should distinguish:

```text
Current state
```

from:

```text
Historical state
```

## 34.6 Timeline Filtering

Filter by:

```text
Project
Workspace
Branch
Date
Topic
Agent
```

## 34.7 "Why Did We Change This?"

Atlas should trace:

```text
Code change
 ↓
Commit
 ↓
Session
 ↓
Decision
 ↓
Reason
```

## 34.8 Timeline UI

Possible design:

```text
PROJECT TIMELINE

● Today
  Retrieval ranking changed

● Yesterday
  Architecture decision

● Aug 10
  Bug discovered

● Aug 08
  Authentication refactor
```

## 34.9 Timeline Should Be Useful

Do not create a noisy event stream.

Prioritize meaningful development events.

---

# Document 35: Atlas Task & Intent Intelligence

## 35.1 Purpose

Atlas should understand what the developer is currently trying to accomplish.

## 35.2 Intent

The developer may say:

```text
Let's fix the login bug.
```

Atlas identifies:

```text
Intent:
Fix authentication login bug
```

## 35.3 Intent Sources

Use:

```text
Current conversation
Current files
Git changes
Recent commands
Recent task
Previous handoff
Project memory
```

## 35.4 Task Lifecycle

```text
DISCOVERED
   ↓
ACTIVE
   ↓
BLOCKED
   ↓
COMPLETED
   ↓
ARCHIVED
```

## 35.5 Task Detection

Atlas can detect:

```text
TODO
FIX
IMPLEMENT
REFACTOR
INVESTIGATE
TEST
DOCUMENT
```

## 35.6 Unfinished Work

If a session ends with:

```text
Still need to add tests.
```

Atlas creates or updates:

```text
Task:
Add integration tests
```

## 35.7 Task Completion

Atlas should avoid assuming completion simply because files changed.

Strong completion signals include:

```text
User confirmation
Tests passing
Explicit statement
Merged commit
```

## 35.8 Intent Drift

A developer may start with:

```text
Fix login bug
```

and later decide:

```text
Rewrite authentication.
```

Atlas should update current intent rather than forcing the old task.

## 35.9 Current Focus

Atlas should maintain:

```text
Current focus
```

with a confidence level.

## 35.10 Context Integration

Current intent becomes one of the strongest signals for memory retrieval.

---

# Document 36: Atlas Proactive Intelligence & Suggestions

## 36.1 Purpose

Atlas should sometimes notice useful information before the developer asks.

However, proactive behavior must remain controlled.

## 36.2 Good Proactive Suggestions

Examples:

```text
Your README describes the old authentication flow.

You previously solved a similar error in another session.

This architecture decision conflicts with an older active note.

You have an unfinished task related to this file.

This TODO has remained open for 30 days.
```

## 36.3 Bad Proactive Behavior

Atlas should not constantly interrupt with:

```text
AI suggestions
AI suggestions
AI suggestions
```

## 36.4 Notification Levels

```text
SILENT
LOW
NORMAL
IMPORTANT
```

## 36.5 Silent Mode

Atlas records insights without interrupting the developer.

## 36.6 Important Suggestion

Only interrupt when the information has strong value.

Example:

```text
ATLAS

Possible conflict detected.

Current code uses:
server-side sessions

Old project memory says:
JWT-based sessions

[Review]
```

## 36.7 Previous Solution Discovery

If the current error resembles an old problem:

```text
ATLAS

You encountered a similar issue on Aug 3.

Previous solution:
Release database connections after transactions.

[Show]
```

## 36.8 Documentation Drift

Atlas can detect:

```text
Code
≠
Documentation
```

and suggest an update.

## 36.9 Proactive Intelligence Rules

Suggestions should consider:

```text
Confidence
Importance
Relevance
Recency
User preference
Frequency
```

## 36.10 User Feedback

Users can select:

```text
Useful
Not useful
Never show this
```

This feedback improves future behavior.

---

# Document 37: Atlas Memory Quality & Self-Correction System

## 37.1 Purpose

A memory system becomes dangerous if it accumulates incorrect information.

Atlas needs memory hygiene.

## 37.2 Memory Problems

Atlas should detect:

```text
Duplicates
Contradictions
Stale information
Low-confidence memories
Incorrect summaries
Superseded decisions
```

## 37.3 Duplicate Detection

Example:

```text
Memory A:
Use CockroachDB.

Memory B:
The database is CockroachDB.
```

These may be merged or linked.

## 37.4 Contradiction Detection

Example:

```text
Memory A:
Use PostgreSQL.

Memory B:
Use CockroachDB instead.
```

Atlas identifies a conflict.

## 37.5 Supersession

The system can mark:

```text
PostgreSQL decision
STATUS: SUPERSEDED
```

and:

```text
CockroachDB decision
STATUS: ACTIVE
```

## 37.6 Stale Memory

A memory can become stale when:

```text
Code changes
Architecture changes
Documentation changes
User explicitly changes direction
```

## 37.7 Memory Review

Atlas may surface:

```text
3 memories may be outdated.

[Review]
```

## 37.8 Confidence Decay

If information becomes unsupported by current project state, confidence may decrease.

## 37.9 Human Confirmation

Important changes should be reviewable.

## 37.10 Memory Cleanup

Possible command:

```bash
atlas doctor memory
```

Output:

```text
MEMORY HEALTH

1 duplicate
2 stale memories
1 unresolved conflict

Review recommended.
```

## 37.11 Trust Principle

Atlas should prefer:

```text
"I am not certain."
```

over confidently providing incorrect memory.

---

# Document 38: Atlas Offline-First & Local Intelligence

## 38.1 Purpose

Atlas should remain useful when connectivity is limited.

## 38.2 Local Components

The local runtime can maintain:

```text
Recent project state
Recent context
Recent sessions
Authentication state
Queued events
Local configuration
```

## 38.3 Offline Mode

When cloud services are unavailable:

```text
ATLAS

Offline mode

Using cached project context.
New events will sync when connection returns.
```

## 38.4 Event Queue

Events can be queued:

```text
Local event
   ↓
Queue
   ↓
Connection restored
   ↓
Sync
```

## 38.5 Conflict Resolution

If local and remote state changed:

```text
Local
vs
Remote
```

Atlas should resolve using deterministic rules where possible and ask the user when necessary.

## 38.6 Local Search

Basic project search should continue offline.

## 38.7 Privacy

Sensitive processing can optionally remain local.

## 38.8 Sync State

Show:

```text
Synced
Syncing
Offline
Conflict
```

## 38.9 Offline Limitations

Advanced AI features may require connectivity.

Atlas should clearly communicate this instead of pretending everything is available.

---

# Document 39: Atlas Advanced CLI & Developer Control Center

## 39.1 Purpose

Atlas should be controllable entirely from the terminal.

## 39.2 Base Command

```bash
atlas
```

opens the interactive CLI.

## 39.3 Status

```bash
atlas status
```

Example:

```text
ATLAS

Runtime:
Running

Auto-fire:
Enabled

Agent integrations:
Claude Code ✓
Codex ✓

Cloud:
Connected

Current project:
Atlas

Sync:
Up to date
```

## 39.4 Projects

```bash
atlas projects
```

Shows:

```text
ACTIVE PROJECTS

★ Atlas
  Last active: today

  SyncSpace
  Last active: yesterday

  Demo
  Last active: Aug 7
```

## 39.5 Memory

```bash
atlas memory
```

Shows important memories.

## 39.6 Search

```bash
atlas search "authentication"
```

Returns relevant memories and project context.

## 39.7 Remember

```bash
atlas remember "Authentication state must remain server-side."
```

Atlas stores the information.

## 39.8 Forget

```bash
atlas forget <memory-id>
```

Deletes or archives the selected memory according to the configured policy.

## 39.9 Context

```bash
atlas context
```

Displays what Atlas would currently provide to the coding agent.

## 39.10 Handoff

```bash
atlas handoff
```

Shows the latest session handoff.

## 39.11 Doctor

```bash
atlas doctor
```

Checks:

```text
Runtime
Authentication
Agent integration
Repository detection
Network
Database
Cache
Configuration
```

## 39.12 Configuration

```bash
atlas config
```

Possible settings:

```text
auto_fire
notifications
memory_capture
privacy
offline_mode
agent_integrations
```

## 39.13 Reset

A safe reset command should exist:

```bash
atlas reset
```

with explicit confirmation.

## 39.14 CLI Design Principle

The CLI should be:

```text
Fast
Predictable
Readable
Scriptable
Developer-friendly
```

---

# Document 40: Atlas Launch, UX Polish & Final Architecture

## 40.1 Purpose

This document defines the complete Atlas product experience and launch-ready architecture.

## 40.2 Final Product

Atlas is:

> A persistent memory and project-continuity layer for terminal-based AI coding agents.

Initial integrations:

```text
Claude Code
Codex
```

## 40.3 Defining Experience

The developer opens a terminal.

They type:

```bash
claude
```

Atlas automatically activates.

No extra command.

No dashboard requirement.

No manual memory import.

Atlas recognizes:

```text
Who
Where
What project
What workspace
What branch
What happened previously
What matters now
```

## 40.4 Startup

```text
ATLAS ✓

WELCOME BACK

Atlas

Last focus:
Context retrieval

Completed:
Memory indexing

Open:
→ Ranking tests
→ Retrieval evaluation

Important:
Hybrid retrieval is active.

Context loaded.
```

Claude Code then continues normally.

## 40.5 Returning With Another Agent

Later:

```bash
codex
```

Atlas recognizes the same project.

```text
ATLAS ✓

WELCOME BACK

You were last working on:

Memory retrieval

Previous decision:
Use hybrid structured + semantic retrieval.

Next:
Finish ranking tests.

Context loaded.
```

## 40.6 The Magic Moment

The user never told Codex what happened.

Atlas already knew.

That is the moment the product should demonstrate.

## 40.7 Complete Architecture

```text
                    DEVELOPER
                        │
                        ▼
                    TERMINAL
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Claude Code              Codex
             │                     │
             └──────────┬──────────┘
                        ▼
                  ATLAS RUNTIME
                        │
        ┌───────────────┼─────────────────┐
        ▼               ▼                 ▼
   Environment      Project           Agent
   Detection       Intelligence       Adapter
        │               │                 │
        └───────────────┼─────────────────┘
                        ▼
                 CONTEXT ENGINE
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
          Memory      Retrieval   Timeline
          Engine       Engine     Engine
             │          │          │
             └──────────┼──────────┘
                        ▼
                 MEMORY GRAPH
                        │
                        ▼
                  COCKROACHDB
                  ┌─────┴─────┐
                  ▼           ▼
             Structured    Vector
               Data         Index
                  │           │
                  └─────┬─────┘
                        ▼
                       AWS
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Bedrock   Lambda       S3
```

## 40.8 User Experience Layers

### Layer 1: Invisible

```text
Runtime
Detection
Caching
Sync
```

### Layer 2: Helpful

```text
Startup context
Handoffs
Memory retrieval
Suggestions
```

### Layer 3: Interactive

```text
CLI
Dashboard
Memory explorer
Project timeline
```

The first two layers should deliver the core value without requiring the dashboard.

## 40.9 Installation

The ideal experience:

```bash
npm install -g atlas
atlas setup
```

or an equivalent official installer depending on packaging decisions.

Setup should configure:

```text
Authentication
Shell integration
Claude integration
Codex integration
Local runtime
```

## 40.10 First Launch

```text
ATLAS

Let's set things up.

✓ Runtime
✓ Shell integration
✓ Claude Code
✓ Codex

Atlas is ready.

Start coding normally.
```

## 40.11 Dashboard

The dashboard should contain:

```text
Projects
Timeline
Memories
Tasks
Decisions
Sessions
Settings
```

But the dashboard should never be required for normal coding.

## 40.12 Security

The final product must include:

```text
Encryption
Authentication
Authorization
Project isolation
Secret filtering
Audit logs
Memory deletion
User controls
```

## 40.13 Performance

Important operations should prioritize:

```text
Local cache
Fast repository detection
Incremental indexing
Background AI processing
Efficient retrieval
```

## 40.14 Reliability

If Atlas fails:

```text
Coding agent continues.
```

If cloud AI fails:

```text
Cached context continues.
```

If the network fails:

```text
Offline mode activates.
```

## 40.15 Evaluation

Atlas should measure:

```text
Retrieval usefulness
Memory accuracy
Context relevance
Latency
Repeated explanation reduction
Cross-agent continuity
```

## 40.16 Launch Metrics

Initial product metrics can include:

```text
Projects connected
Active developers
Sessions remembered
Memories created
Memory retrieval success
Cross-agent sessions
Average startup latency
```

## 40.17 Product Positioning

Avoid positioning Atlas as:

```text
AI chatbot
AI assistant
Another coding agent
Simple memory database
```

Position it as:

> **The memory layer for your coding agents.**

## 40.18 Product Differentiator

The strongest differentiator is not:

```text
"We store your AI conversations."
```

It is:

```text
"You start coding normally,
and Atlas already knows where you left off."
```

## 40.19 Launch Narrative

Problem:

```text
AI coding agents are powerful,
but sessions are disposable.
```

Solution:

```text
Atlas gives them continuity.
```

Experience:

```text
Type claude.
Type codex.
Keep coding.

Atlas remembers.
```

## 40.20 Final Product Loop

```text
START
  ↓
DETECT
  ↓
UNDERSTAND
  ↓
RETRIEVE
  ↓
CONTEXTUALIZE
  ↓
CODE
  ↓
OBSERVE
  ↓
REMEMBER
  ↓
HANDOFF
  ↓
RETURN
  ↓
REMEMBER AGAIN
```

## 40.21 Final Product Principle

Atlas should make returning to a project feel like returning to a conversation with someone who was actually there.

Not:

> "What was I doing?"

But:

> "Welcome back. Here's where you left off."

## 40.22 Final Statement

Atlas does not replace Claude Code.

Atlas does not replace Codex.

Atlas gives them continuity.

The terminal remains the developer's workspace.

The coding agent remains the developer's builder.

Atlas becomes the memory that connects everything.

# END OF DOCUMENTS 31–40
