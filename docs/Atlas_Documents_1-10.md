# ATLAS
## Documents 1–10: Product Foundation, Memory Model, Project Intelligence, Auto-Fire Experience, and Context Engine

**Project:** Atlas  
**Documents:** 1–10  
**Status:** Product + Technical Specification  
**Version:** 1.0

---

# Document 1: Atlas Product Vision

## 1.1 Product Name

The product is called:

# ATLAS

Atlas is a persistent memory and continuity layer for terminal-based AI coding agents.

Initial supported agents:

- Claude Code
- Codex

Atlas is not another coding agent.

It sits beside the coding agent and gives it long-term project and developer context.

## 1.2 The Core Problem

AI coding agents are powerful, but each session can feel disconnected.

A developer may work on a project for weeks and repeatedly explain:

- what the project does
- why a decision was made
- what remains unfinished
- what was tried previously
- which approach failed
- what the next step should be

Atlas exists to eliminate that repetition.

## 1.3 The Core Idea

Atlas remembers what matters.

When a developer returns to a project, Atlas can surface:

```text
What happened?
Where did I stop?
What matters?
What decisions were made?
What remains?
What should I know before continuing?
```

## 1.4 The Product Promise

The central product promise is:

> **You don't open Atlas. Atlas opens with you.**

The developer simply uses:

```bash
claude
```

or:

```bash
codex
```

Atlas automatically detects the environment and prepares relevant context.

## 1.5 What Atlas Is Not

Atlas is not:

- a replacement for Claude Code
- a replacement for Codex
- a generic chatbot
- a conventional project management tool
- a simple conversation history database
- a second IDE

It is a persistent intelligence and memory layer.

## 1.6 Product Philosophy

Atlas should be:

```text
Invisible when unnecessary.
Present when useful.
Automatic by default.
Controllable by the developer.
Agent-agnostic.
Project-aware.
Memory-aware.
```

---

# Document 2: The Atlas User Experience

## 2.1 First-Time User

Developer installs Atlas.

They run:

```bash
atlas setup
```

Atlas configures the local runtime and supported coding-agent integrations.

The user then continues using their normal workflow.

## 2.2 Returning User

The developer opens a terminal and runs:

```bash
cd ~/projects/my-app
claude
```

Atlas detects:

```text
Project:
my-app

Repository:
my-app

Workspace:
root

Branch:
feature/auth
```

Atlas retrieves relevant memory.

The developer sees a lightweight startup experience:

```text
ATLAS ✓

WELCOME BACK

my-app

Last focus:
Authentication

Open:
→ Finish refresh-token flow

Important:
Sessions are stored server-side.

Context loaded.
```

Then Claude Code starts normally.

## 2.3 Codex

The same experience should work with:

```bash
codex
```

Atlas does not care which agent is being used.

The same project memory can be available to both.

## 2.4 Both Agents

A developer can use:

```text
Monday → Claude Code
Tuesday → Codex
Wednesday → Claude Code
```

Atlas maintains continuity across all three sessions.

## 2.5 New Project

If the directory contains a new repository:

```text
ATLAS

NEW PROJECT DETECTED

my-new-project

No previous Atlas memory found.

Atlas will begin learning important project context.
```

## 2.6 No Repository

The user may start Claude or Codex from anywhere.

Example:

```bash
cd ~/Downloads
claude
```

Atlas should not fail.

It should say:

```text
ATLAS

No repository detected.

Temporary workspace context enabled.
```

If the user later enters a repository, Atlas detects the change.

## 2.7 The Experience Must Stay Fast

Atlas should never make the developer wait unnecessarily.

Preferred:

```text
Agent starts
      ↓
Atlas detects environment
      ↓
Cached context appears
      ↓
Fresh context loads in background
```

---

# Document 3: Atlas Terminal Runtime

## 3.1 Purpose

The Atlas Runtime is the local component responsible for detecting the developer's environment.

It runs alongside the terminal and coding agent.

Conceptually:

```text
Operating System
      │
      ▼
Terminal
      │
      ├── Atlas Runtime
      │
      ├── Claude Code
      │
      └── Codex
```

## 3.2 Responsibilities

The runtime should:

- detect supported agents
- detect the current working directory
- detect repositories
- identify projects
- identify workspaces
- identify branches
- identify sessions
- communicate with Atlas services
- retrieve context
- expose context to the appropriate agent adapter

## 3.3 Environment Detection

Atlas should inspect:

```text
Current directory
Git repository
Git branch
Repository remote
Project configuration
Agent process
```

## 3.4 Directory Changes

Users do not always start Claude or Codex inside the final project directory.

Example:

```bash
cd ~/projects
claude
```

Then:

```bash
cd ~/projects/atlas
```

Atlas must update its project context dynamically.

## 3.5 Runtime States

```text
STARTING
DETECTING
READY
NO_PROJECT
NEW_PROJECT
SYNCING
ERROR
DISABLED
```

## 3.6 Failure Isolation

If Atlas is unavailable:

```text
Claude Code / Codex
```

must continue working.

Atlas should never become a hard dependency.

## 3.7 Local Cache

Atlas should maintain a small local cache for:

- recent project identity
- recent context
- session state
- authentication
- runtime configuration

This enables fast startup.

---

# Document 4: Project Discovery & Project Intelligence

## 4.1 Purpose

Atlas must understand where the developer is working before it can decide what memory matters.

## 4.2 Project Detection

Atlas should detect:

```text
Git repository
Repository name
Remote URL
Root directory
Branch
Workspace
Language
Framework
Package manager
Important project files
```

## 4.3 Repository Identity

A repository should have a stable identity rather than relying only on its local folder name.

Example:

```text
Project:
Atlas

Repository:
github.com/example/atlas
```

This prevents confusion when a project is cloned into different directories.

## 4.4 Workspace Identity

Atlas should distinguish:

```text
Project
   ↓
Repository
   ↓
Workspace
   ↓
Branch
```

Example:

```text
Project:
Atlas

Workspace:
packages/memory

Branch:
feature/retrieval
```

## 4.5 Project Profile

Atlas can build a lightweight project profile:

```text
PROJECT PROFILE

Name:
Atlas

Language:
TypeScript

Framework:
Node.js

Repository:
atlas

Main areas:
runtime
memory
retrieval
cli
```

## 4.6 Important Files

Atlas can identify files such as:

```text
README.md
ATLAS.md
package.json
Cargo.toml
pyproject.toml
go.mod
docker-compose.yml
.env.example
docs/
```

Atlas should not read sensitive files indiscriminately.

## 4.7 Project State

Atlas should track:

```text
Current branch
Recent commits
Uncommitted changes
Current workspace
Recent files
Open tasks
Recent sessions
```

## 4.8 Project Dashboard

Atlas can eventually expose:

```text
PROJECT

Atlas

Active:
3 tasks

Important:
5 memories

Recent:
2 sessions

Last worked:
3 hours ago

Current focus:
Memory retrieval
```

---

# Document 5: Atlas Memory Model

## 5.1 Purpose

Atlas needs a memory model designed specifically for software development.

## 5.2 Memory Is Not Chat History

Atlas should not simply store every conversation.

Instead, it extracts useful information.

For example:

```text
Conversation:
"We should probably move this into a separate service."

```

does not automatically become a permanent architecture decision.

But:

```text
"We decided to move authentication into a separate service."
```

can become a decision.

## 5.3 Memory Types

Core types:

```text
PROJECT FACT
DECISION
TASK
ARCHITECTURE
CONSTRAINT
DISCOVERY
WARNING
LESSON
PREFERENCE
HANDOFF
```

## 5.4 Memory Lifecycle

```text
Captured
   ↓
Classified
   ↓
Scored
   ↓
Active
   ↓
Updated / Superseded
   ↓
Archived
```

## 5.5 Memory Record

A conceptual memory record:

```text
id
project_id
workspace_id
branch_id
session_id
type
title
content
importance
confidence
status
created_at
updated_at
source
embedding
```

## 5.6 Importance

Atlas should identify:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Important architecture decisions should survive for a long time.

Minor debugging comments should not dominate retrieval.

## 5.7 Confidence

Memory should also have confidence.

Example:

```text
High:
"We decided to use CockroachDB."

Low:
"Maybe Redis is used for caching."
```

Low-confidence information should not be presented as fact.

## 5.8 Superseded Memory

Atlas must preserve history.

Example:

```text
OLD:
PostgreSQL is the primary database.

NEW:
CockroachDB replaced PostgreSQL.
```

The old memory remains historically useful but is marked:

```text
SUPERSEDED
```

---

# Document 6: Memory Capture Engine

## 6.1 Purpose

The Capture Engine determines what should become memory.

## 6.2 Capture Sources

Potential sources:

```text
Agent conversation
User instructions
Git changes
Commit messages
Terminal events
Project files
Session events
Explicit Atlas commands
```

## 6.3 Explicit Capture

The strongest signal:

```text
Remember that authentication uses server-side sessions.
```

Atlas saves this as an important memory.

## 6.4 Automatic Capture

Atlas can detect statements such as:

```text
"We decided..."
"We're going with..."
"Don't change..."
"The reason we..."
"Next session we need to..."
"This failed because..."
```

These are strong candidates.

## 6.5 Temporary Thoughts

Atlas should distinguish:

```text
Idea
```

from:

```text
Decision
```

Example:

```text
Maybe we should use Redis.
```

can be classified:

```text
EXPLORATION
```

rather than:

```text
ARCHITECTURE DECISION
```

## 6.6 Memory Promotion

An idea can become a decision:

```text
Idea
 ↓
Discussion
 ↓
Decision
 ↓
Active memory
```

## 6.7 Capture Pipeline

```text
Session Event
     ↓
Candidate Detection
     ↓
Classification
     ↓
Importance
     ↓
Confidence
     ↓
Deduplication
     ↓
Conflict Detection
     ↓
Memory Store
```

## 6.8 Avoiding Memory Spam

Atlas should reject or deprioritize:

```text
Small talk
Repeated facts
Temporary thoughts
Low-value debugging output
Routine commands
Unimportant file changes
```

---

# Document 7: Project Continuity & Session Memory

## 7.1 Purpose

Atlas should remember where the developer left off.

## 7.2 Session Record

Every meaningful coding session can contain:

```text
Session ID
User
Project
Repository
Workspace
Branch
Agent
Start time
End time
Current focus
Completed work
Remaining work
Important decisions
Warnings
Next step
```

## 7.3 Session Start

Atlas retrieves the previous relevant session.

Example:

```text
Last session:
Authentication

Completed:
Login endpoint

Remaining:
Refresh-token handling
```

## 7.4 Session During Work

Atlas observes important changes.

Example:

```text
Task completed:
Login endpoint

Decision:
Use secure HTTP-only cookies.

Discovery:
Existing middleware already validates sessions.
```

## 7.5 Session Handoff

At the end:

```text
SESSION HANDOFF

What I was doing:
Authentication

Completed:
Login endpoint

Decision:
HTTP-only cookies

Still open:
Refresh-token integration tests

Next:
Add integration tests
```

## 7.6 Handoff Must Be Compact

The handoff should not become a transcript.

It should be a compressed representation of useful continuity.

## 7.7 Cross-Agent Continuity

Example:

```text
Claude Code session
        ↓
Atlas
        ↓
Handoff
        ↓
Codex session
```

The next agent can continue without the developer repeating everything.

---

# Document 8: Atlas Project Documentation Layer

## 8.1 Purpose

Atlas should convert important memory into durable project documentation.

## 8.2 ATLAS.md

Each project can optionally contain:

```text
ATLAS.md
```

Example:

```markdown
# Atlas Project Context

## Purpose

Atlas provides persistent memory for coding agents.

## Architecture

...

## Important Decisions

...

## Current Work

...

## Known Issues

...

## Development Commands

...
```

## 8.3 Why ATLAS.md Matters

It provides a portable project context layer.

If a repository moves to another machine:

```text
Repository
   ↓
ATLAS.md
   ↓
Project context
```

## 8.4 README Assistance

Atlas can detect when the README is outdated.

Example:

```text
ATLAS

Documentation drift detected.

The README describes the old authentication flow.

Suggested update available.

[Review]
[Apply]
[Ignore]
```

## 8.5 Never Silently Rewrite

Critical project documentation should require user approval unless the user explicitly enables automatic updates.

## 8.6 Project Jots

Atlas can maintain concise notes:

```text
PROJECT JOTS

Current architecture:
...

Important constraint:
...

Current task:
...

Known issue:
...
```

## 8.7 AI Documentation

Bedrock or another configured model can help generate:

```text
Architecture summaries
Handoffs
README suggestions
Decision summaries
Project jots
```

Deterministic information should remain rule-driven where possible.

---

# Document 9: Atlas Memory Retrieval System

## 9.1 Purpose

Stored memory is only useful if Atlas can retrieve the right information at the right time.

## 9.2 Retrieval Problem

A mature Atlas installation may contain:

```text
Thousands of memories
Hundreds of sessions
Many tasks
Many decisions
```

Atlas cannot dump all of this into Claude Code or Codex.

## 9.3 Retrieval Inputs

Atlas should understand:

```text
Current project
Repository
Workspace
Branch
Current files
Current task
Agent
Recent session
User request
```

## 9.4 Hybrid Retrieval

Atlas should combine:

```text
Structured search
+
Semantic vector search
```

Example:

```text
Project = Atlas
Workspace = packages/memory
Status = ACTIVE
```

combined with semantic similarity to:

```text
"retrieval ranking"
```

## 9.5 Candidate Retrieval

Example:

```text
2,000 memories
      ↓
50 candidates
      ↓
Ranking
      ↓
8 relevant memories
```

## 9.6 Ranking Signals

Potential signals:

```text
Semantic similarity
Project match
Workspace match
Branch match
Task relevance
Importance
Confidence
Recency
Active status
Historical relationship
```

## 9.7 Relevance Hierarchy

Atlas should understand:

```text
Workspace memory
      >
Project memory
      >
Global memory
```

when all else is equal.

But a highly important project-wide decision can outrank a low-value workspace note.

## 9.8 Historical Awareness

Atlas should not surface outdated information as current.

Example:

```text
Current:
CockroachDB

Historical:
PostgreSQL
```

The retrieval layer should understand this distinction.

## 9.9 Context Compression

If 15 memories are relevant:

```text
15 memories
    ↓
5 key facts
```

The agent receives concise context while the originals remain available.

## 9.10 Just-in-Time Retrieval

Atlas should retrieve context when needed.

Example:

```text
Developer:
"How did we implement authentication?"

Atlas:
Retrieves authentication decisions,
related sessions, architecture,
and relevant documentation.
```

## 9.11 Error-Aware Retrieval

If the agent encounters an error:

```text
Database connection timeout
```

Atlas can search for previous similar incidents and fixes.

Example:

```text
ATLAS MEMORY

A similar issue occurred previously.

Cause:
Connection pool exhaustion.

Previous fix:
Connections were released after transactions.
```

---

# Document 10: Atlas Context Engine

## 10.1 Purpose

The Context Engine connects project intelligence, memory, session history, and retrieval.

Its job is simple:

> **Given what the developer is doing right now, what information should Atlas bring back?**

## 10.2 Context Pipeline

```text
Current Environment
        ↓
Context Snapshot
        ↓
Candidate Retrieval
        ↓
Metadata Filtering
        ↓
Semantic Search
        ↓
Importance Ranking
        ↓
Conflict Detection
        ↓
Deduplication
        ↓
Context Compression
        ↓
Agent Context
```

## 10.3 Context Snapshot

Example:

```text
Agent:
Claude Code

Project:
Atlas

Repository:
atlas

Workspace:
packages/memory

Branch:
feature/retrieval

Recent activity:
retrieval/ranker.ts

Current task:
Improve ranking

Last session:
3 hours ago
```

## 10.4 Context Query

Atlas effectively asks:

> What memories are relevant to someone working on the Atlas memory package, on the retrieval branch, currently working on ranking?

This is much more useful than:

> Find memories about Atlas.

## 10.5 Context Sources

The Context Engine combines:

```text
Project Intelligence
Memory Engine
Session History
Current Workspace
Current Task
Current Agent
```

## 10.6 Relevance

A memory can receive relevance based on:

```text
Semantic similarity
Project relevance
Workspace relevance
Branch relevance
Task relevance
Importance
Confidence
Recency
```

## 10.7 Importance vs Recency

Recency should not dominate.

Example:

```text
Architecture decision:
3 months old
High importance
```

can be more relevant than:

```text
Debugging note:
2 hours old
Low importance
```

## 10.8 Active vs Historical

Atlas distinguishes:

```text
ACTIVE
```

from:

```text
HISTORICAL
```

The agent normally receives active information.

Historical information can be retrieved when necessary.

## 10.9 Context Types

Retrieved context can be classified as:

```text
DECISION
TASK
HANDOFF
ARCHITECTURE
CONSTRAINT
DISCOVERY
WARNING
PROJECT SUMMARY
```

## 10.10 Startup Context

The visible Atlas startup should remain concise:

```text
ATLAS ✓

WELCOME BACK

Project:
Atlas

Current focus:
Memory retrieval

Open:
→ Improve ranking
→ Add integration tests

Important:
CockroachDB is the system of record.

Context loaded.
```

## 10.11 Agent Context

The agent can receive a richer machine-readable context package:

```text
PROJECT SUMMARY
CURRENT FOCUS
ACTIVE TASKS
ACTIVE DECISIONS
RELEVANT ARCHITECTURE
RECENT HANDOFF
WARNINGS
```

## 10.12 Context Budget

Atlas should use configurable context budgets.

Example:

```text
Startup:
small context

Task retrieval:
medium context

Explicit deep search:
large context
```

Exact token limits should be implementation parameters rather than hard-coded product promises.

## 10.13 Context Cache

Atlas should cache frequently used context.

Example:

```text
Project + Workspace + Branch
        ↓
Context Cache
        ↓
Instant startup context
```

Fresh context can load in the background.

## 10.14 Cache Invalidation

Invalidate when meaningful state changes:

```text
Branch change
Project change
Important memory update
Task completion
Major architecture decision
```

## 10.15 Context Explainability

Users should be able to ask:

```text
Why did Atlas show me this?
```

Atlas can answer:

```text
This memory was surfaced because:

✓ Same project
✓ Same workspace
✓ Related to your current task
✓ Marked important
```

## 10.16 Context Feedback

Users can say:

```text
Not relevant.
```

or:

```text
This is important.
```

Atlas records feedback to improve future retrieval.

## 10.17 Context Safety

Before memory is injected:

```text
Candidate memory
      ↓
Active?
      ↓
Relevant?
      ↓
High enough confidence?
      ↓
Superseded?
      ↓
Authorized?
      ↓
Inject
```

## 10.18 End-to-End Flow

```text
Developer opens terminal
        ↓
Types claude / codex
        ↓
Atlas auto-fires
        ↓
Detects current environment
        ↓
Identifies project
        ↓
Loads cached context
        ↓
Retrieves fresh memory
        ↓
Ranks relevant information
        ↓
Builds context package
        ↓
Agent starts
        ↓
Developer works
        ↓
Atlas captures important information
        ↓
Session handoff saved
        ↓
Developer returns later
        ↓
Atlas remembers
```

## 10.19 Core Product Principle

Atlas should not try to replace the coding agent.

Claude Code and Codex already handle coding.

Atlas answers:

> **What happened before I got here?**

and:

> **What should I know before I continue?**

That is the foundation of the Atlas experience.
