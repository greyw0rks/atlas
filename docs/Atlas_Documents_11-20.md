# ATLAS
## Documents 11–20: Terminal Runtime, Memory Capture, AI Documentation, Infrastructure, CLI, and End-to-End Architecture

**Project:** Atlas  
**Documents:** 11–20  
**Status:** Product + Technical Specification  
**Version:** 1.0

---

# Document 11: Auto-Fire Runtime & Terminal Integration

## 11.1 Purpose

Atlas's defining feature is that it should appear when developers start coding, without requiring them to remember to launch Atlas.

The experience should feel like Atlas is part of the terminal environment.

A developer may start with:

```bash
claude
```

or:

```bash
codex
```

or:

```bash
cd ~/projects/atlas
claude
```

or even:

```bash
cd ~/projects
claude
```

Atlas must handle all of these.

## 11.2 Core Principle

The user should not need to think:

> "I need to open Atlas before I start coding."

Instead:

```text
Open terminal
      ↓
Start Claude Code / Codex
      ↓
Atlas detects the session
      ↓
Atlas discovers the environment
      ↓
Atlas prepares relevant context
      ↓
Agent starts with continuity
```

## 11.3 Terminal-Level Integration

Atlas should have a lightweight local runtime installed on the user's machine.

Conceptually:

```text
Terminal
   │
   ├── Atlas Runtime
   │
   ├── Claude Code
   │
   └── Codex
```

Atlas should not replace either coding agent.

It operates beside them.

## 11.4 When the User Starts From a Random Directory

Example:

```bash
cd ~/Downloads
claude
```

Atlas should inspect the current working directory.

If there is no repository:

```text
ATLAS

No project detected.

Temporary workspace memory enabled.
```

The user can continue normally.

If the user later runs:

```bash
cd ~/projects/my-app
```

Atlas detects the new project context.

## 11.5 Auto-Fire States

Atlas should have several states:

```text
DETECTING
LOADING
READY
NO PROJECT
NEW PROJECT
ERROR
DISABLED
```

## 11.6 Startup Experience

The terminal should remain fast.

The target experience is:

```text
ATLAS ✓

Welcome back.

Project: Atlas
Workspace: packages/memory
Branch: feature/retrieval

Current focus:
Memory retrieval

Open:
→ Improve ranking
→ Add integration tests

Context loaded.
```

Then the coding agent proceeds.

## 11.7 Background Initialization

Atlas should avoid blocking Claude Code or Codex.

The preferred model:

```text
Agent starts
      ↓
Atlas starts in parallel
      ↓
Fast project detection
      ↓
Cached context appears immediately
      ↓
Fresh context loads in background
```

## 11.8 Failure Behavior

If Atlas fails:

```text
Claude Code / Codex
```

must still work.

Atlas is an enhancement, never a hard dependency.

---

# Document 12: Claude Code & Codex Adapter Layer

## 12.1 Purpose

Atlas should work with multiple coding agents without becoming tightly coupled to one.

Initial targets:

```text
Claude Code
Codex
```

Later:

```text
Other terminal coding agents
```

## 12.2 Agent-Agnostic Core

Atlas architecture:

```text
              Atlas Core
                  │
          Context Engine
                  │
          Adapter Interface
            /          \
           /            \
   Claude Adapter    Codex Adapter
```

The memory system remains identical.

Only the integration layer changes.

## 12.3 Claude Code

Atlas should detect Claude Code sessions and expose context through the supported Claude integration mechanism available to the implementation.

The adapter is responsible for:

- startup detection
- context delivery
- memory retrieval
- memory saving
- session identification
- safe command integration

## 12.4 Codex

The Codex adapter performs the same conceptual functions:

- startup detection
- context delivery
- memory retrieval
- memory saving
- session identification
- project detection

The internal Atlas memory format remains unchanged.

## 12.5 Shared User Memory

If a user uses both:

```text
Claude Code
```

and:

```text
Codex
```

they should see the same Atlas memory.

Example:

Monday:

```text
Claude Code
→ architecture decision saved
```

Tuesday:

```text
Codex
→ Atlas retrieves that decision
```

The memory belongs to the project/user, not the agent.

## 12.6 Agent Identity

Atlas should record:

```text
agent = claude
```

or:

```text
agent = codex
```

This provides useful session metadata.

## 12.7 Adapter Contract

Every agent adapter should implement a consistent interface conceptually:

```text
detect()
start_session()
get_context()
inject_context()
capture_events()
end_session()
```

This makes future integrations easier.

---

# Document 13: Session Lifecycle & Handoff System

## 13.1 Purpose

Atlas should remember not only facts, but where the developer stopped.

A session should have a lifecycle:

```text
START
  ↓
ACTIVE
  ↓
IDLE
  ↓
ENDING
  ↓
COMPLETED
```

## 13.2 Session Start

When Claude Code or Codex starts:

Atlas creates:

```text
session_id
user_id
project_id
workspace
branch
agent
start_time
```

## 13.3 During the Session

Atlas observes meaningful events rather than blindly storing every message.

Potential events:

```text
Task created
Task completed
Decision made
Important discovery
Architecture changed
Error solved
File changed
User explicitly asks Atlas to remember something
```

## 13.4 Session Handoff

At the end of a session Atlas generates a compact handoff.

Example:

```text
SESSION HANDOFF

Project:
Atlas

Workspace:
packages/memory

Focus:
Retrieval ranking

Completed:
✓ Added candidate scoring

Remaining:
→ Add ranking tests

Important:
Duplicate semantic results remain unresolved.

Next suggested step:
Test ranking against duplicate-heavy datasets.
```

## 13.5 Explicit Handoff

The user should also be able to request:

```bash
atlas handoff
```

or:

```text
Atlas, save a handoff for this session.
```

## 13.6 Automatic Handoff

Atlas should attempt automatic handoff creation when:

- the agent exits
- the terminal session ends
- the developer becomes inactive for a meaningful period
- the project changes
- the agent session is explicitly closed

## 13.7 Handoff Quality

A handoff should answer:

```text
What was I doing?
What changed?
What remains?
What did I learn?
What should I do next?
```

## 13.8 Returning Session

The next time the developer returns:

```text
ATLAS

WELCOME BACK

Last session:
Retrieval ranking

Completed:
Candidate scoring

Still open:
Ranking tests

Previous warning:
Duplicate semantic results.
```

---

# Document 14: Memory Capture & Importance Detection

## 14.1 Purpose

Atlas must avoid becoming a database of meaningless conversation.

Not everything deserves long-term memory.

## 14.2 Memory Categories

Atlas should recognize:

```text
DECISION
TASK
DISCOVERY
CONSTRAINT
ARCHITECTURE
WARNING
PREFERENCE
HANDOFF
PROJECT FACT
LESSON
```

## 14.3 Example

Developer says:

> "Let's use CockroachDB as the persistent system of record."

Atlas should identify:

```text
Type:
DECISION

Importance:
HIGH

Project:
Atlas
```

## 14.4 Importance Scoring

A memory can be scored using:

```text
Explicit user importance
Repeated reference
Project impact
Future usefulness
Architecture impact
Task relevance
Confidence
```

## 14.5 Explicit Memory

The strongest signal is direct instruction:

```text
Remember that authentication uses server-side sessions.
```

Atlas should save it with high confidence.

## 14.6 Automatic Memory

Atlas can identify important information without an explicit request.

Example:

```text
Decision:
The retrieval system will use hybrid search.
```

But automatic capture must be conservative.

## 14.7 Temporary Thoughts

Statements such as:

```text
Maybe we should use Redis.
```

should not automatically become permanent architecture.

Atlas may store them as:

```text
EXPLORATION
```

rather than:

```text
DECISION
```

## 14.8 Memory Promotion

A temporary thought can later become a decision.

```text
Exploration
   ↓
Discussion
   ↓
Decision
   ↓
Active architecture
```

## 14.9 Superseding Memories

If:

```text
Memory A:
Use PostgreSQL.
```

later becomes:

```text
Memory B:
Migrated to CockroachDB.
```

Atlas should preserve history while marking Memory A as superseded.

## 14.10 Memory Quality

Every memory should have:

```text
confidence
importance
created_at
updated_at
source_session
project
workspace
status
```

---

# Document 15: AI-Generated README & Project Jots

## 15.1 Purpose

Atlas should turn important project memory into durable project documentation.

The developer should not have to repeatedly explain the project to future agents.

## 15.2 Project Jots

Atlas maintains concise notes such as:

```text
PROJECT JOTS

Architecture:
CockroachDB stores persistent memory.

Retrieval:
Hybrid structured + vector search.

Agent support:
Claude Code + Codex.

Important constraint:
Atlas must remain agent-agnostic.
```

## 15.3 README Intelligence

Atlas can create or update important documentation.

Potential files:

```text
README.md
ATLAS.md
docs/architecture.md
docs/decisions.md
```

## 15.4 ATLAS.md

Atlas should support a dedicated project memory file:

```text
ATLAS.md
```

Example:

```text
# Atlas Project Context

## Purpose
Atlas provides persistent memory for coding agents.

## Architecture
...

## Important Decisions
...

## Current Work
...

## Development Commands
...

## Known Issues
...
```

This file is useful even outside Atlas.

## 15.5 AI-Generated Documentation

Atlas can propose:

```text
Documentation update available.

Detected:
Authentication architecture changed.

README currently describes the old flow.

Review update?
```

The user should remain in control.

## 15.6 Never Silently Rewrite Critical Documentation

Atlas should not silently alter important project files.

Preferred flow:

```text
Atlas detected documentation drift.

Suggested update:
...

[Review]
[Apply]
[Ignore]
```

## 15.7 Project Jots vs Memory Database

The database contains richer information.

Project jots are:

```text
small
human-readable
portable
version-controlled
```

They act as a durable bridge between Atlas and other tools.

## 15.8 Repository Revisit

A developer can clone the repository onto another machine.

If `ATLAS.md` exists:

```text
Atlas
   ↓
reads project context
   ↓
rebuilds local memory context
```

This improves portability.

---

# Document 16: Long-Term Memory Architecture

## 16.1 Purpose

Atlas requires a structured memory model capable of storing years of development context.

## 16.2 Core Entities

```text
User
Project
Repository
Workspace
Branch
Session
Memory
Task
Decision
Document
Event
Agent
```

## 16.3 Relationships

Conceptually:

```text
User
 │
 ├── Projects
 │      │
 │      ├── Repositories
 │      ├── Workspaces
 │      ├── Branches
 │      ├── Sessions
 │      └── Memories
 │
 └── Agent Sessions
```

## 16.4 Memory Record

A memory should conceptually contain:

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
embedding
source
```

## 16.5 Memory Status

Possible statuses:

```text
ACTIVE
SUPERSEDED
ARCHIVED
UNCERTAIN
TEMPORARY
```

## 16.6 Memory Relationships

Memories should be connected.

Example:

```text
Decision
   ↓
Task
   ↓
Implementation
   ↓
Discovery
```

This allows Atlas to reconstruct reasoning.

## 16.7 Memory Graph

Conceptually:

```text
             Decision
                │
        ┌───────┴───────┐
        ↓               ↓
      Task          Architecture
        │               │
        ↓               ↓
     Session         Constraint
```

## 16.8 Vector Embeddings

Important memories can receive embeddings for semantic retrieval.

The embedding should coexist with structured metadata.

## 16.9 No Separate Vector Database Requirement

CockroachDB's distributed vector indexing should allow Atlas to keep structured and vector memory together.

This directly supports the hackathon requirement.

---

# Document 17: CockroachDB Memory Layer

## 17.1 Purpose

CockroachDB should be Atlas's persistent system of record.

It stores:

```text
Project metadata
Sessions
Memories
Tasks
Decisions
Embeddings
Events
Documentation metadata
```

## 17.2 Why CockroachDB

Atlas needs:

```text
Persistent storage
PostgreSQL compatibility
Transactional consistency
Vector search
Scalability
High availability
```

## 17.3 Required Hackathon Tools

Atlas should use at least two CockroachDB capabilities.

The recommended implementation uses:

```text
1. CockroachDB Cloud Managed MCP Server
2. Distributed Vector Indexing
```

Potentially also:

```text
3. ccloud CLI
4. Agent Skills
```

## 17.4 MCP Server

The Managed MCP Server can provide controlled access between an AI agent and CockroachDB.

Atlas should use it for appropriate database interactions rather than exposing unrestricted credentials.

## 17.5 Vector Search

Atlas should store embeddings alongside structured memory.

Example conceptual query:

```text
Find memories semantically related to:
"retrieval ranking"
```

while filtering:

```text
project = Atlas
workspace = packages/memory
status = ACTIVE
```

## 17.6 Structured + Vector Query

This is one of Atlas's strongest technical demonstrations:

```text
Project filter
+
Workspace filter
+
Branch filter
+
Vector similarity
+
Importance
```

all contribute to retrieval.

## 17.7 ccloud CLI

The agent-ready ccloud CLI can support infrastructure and operational workflows.

Atlas can use it during deployment and operations where appropriate.

## 17.8 Agent Skills

Atlas can use CockroachDB Agent Skills to encode reliable database workflows.

Potential skills:

```text
Schema design
Query optimization
Security
Observability
Operations
```

## 17.9 Database Schema

The final implementation should include tables conceptually similar to:

```text
users
projects
repositories
workspaces
branches
agents
sessions
memories
tasks
documents
events
memory_relations
```

Vector fields can be included where appropriate.

---

# Document 18: AWS + Bedrock Agent Architecture

## 18.1 Purpose

Atlas must run as a production-capable agentic application using AWS.

## 18.2 Recommended AWS Components

Initial architecture:

```text
AWS
│
├── Amazon Bedrock
│
├── AWS Lambda
│
├── Amazon S3
│
└── Supporting services
```

## 18.3 Amazon Bedrock

Bedrock can provide the AI reasoning layer for:

```text
Memory classification
Memory summarization
Importance detection
Project understanding
Context compression
Handoff generation
Documentation suggestions
```

## 18.4 AWS Lambda

Lambda can handle background jobs such as:

```text
Process session
Generate embeddings
Classify memories
Create handoff
Update project summary
Analyze documentation drift
```

## 18.5 Event-Driven Model

Conceptually:

```text
Developer session
      ↓
Atlas Runtime
      ↓
Event
      ↓
Lambda
      ↓
Bedrock
      ↓
Memory processing
      ↓
CockroachDB
```

## 18.6 Amazon S3

S3 can store larger artifacts where necessary:

```text
Session exports
Large documents
Architecture snapshots
Debug artifacts
Generated reports
```

The primary structured memory remains in CockroachDB.

## 18.7 Background Processing

The user should not wait for every AI operation.

For example:

```text
Session ends
      ↓
Handoff queued
      ↓
Lambda processes
      ↓
Bedrock summarizes
      ↓
CockroachDB stores result
```

## 18.8 Cost Awareness

Atlas should not invoke an expensive model for every terminal event.

Use:

```text
Local detection
+
Rules
+
Cheap processing
+
AI only when useful
```

## 18.9 AI Responsibility

Bedrock should handle tasks that benefit from reasoning.

Rules should handle deterministic tasks such as:

```text
Git branch detection
Repository discovery
File change detection
Session timestamps
```

---

# Document 19: Atlas CLI & Developer Experience

## 19.1 Purpose

Atlas should feel natural in the terminal.

The CLI is not the product's main selling point, but it is the control surface.

## 19.2 Installation

Conceptually:

```bash
npm install -g atlas
```

or another final distribution mechanism.

After installation:

```bash
atlas setup
```

## 19.3 Setup

The setup flow should be minimal:

```text
ATLAS

Connect your account.
✓

Enable Claude Code integration?
✓

Enable Codex integration?
✓

Select memory preferences?
✓

Atlas is ready.
```

## 19.4 Core Commands

Potential commands:

```bash
atlas
atlas status
atlas projects
atlas project
atlas memory
atlas memories
atlas session
atlas handoff
atlas doctor
atlas config
```

## 19.5 Status

```bash
atlas status
```

Output:

```text
ATLAS

Runtime:
✓ Running

Project:
Atlas

Workspace:
packages/memory

Agent:
Claude Code

Memory:
Connected

Context:
Ready
```

## 19.6 Memory Commands

```bash
atlas memory search "authentication"
```

```bash
atlas memory save "Authentication uses server-side sessions."
```

```bash
atlas memory show <id>
```

## 19.7 Project Commands

```bash
atlas projects
```

```bash
atlas project show atlas
```

```bash
atlas project important
```

## 19.8 Session Commands

```bash
atlas session
```

```bash
atlas handoff
```

```bash
atlas sessions
```

## 19.9 Doctor

```bash
atlas doctor
```

Should check:

```text
Atlas runtime
Database connection
AWS configuration
Claude integration
Codex integration
Project detection
Permissions
Network
```

## 19.10 Configuration

Configuration should support:

```text
Automatic startup
Agent integrations
Context size
Memory capture
Privacy settings
Project exclusions
Debug logging
```

## 19.11 User Experience Principle

Atlas commands should be:

```text
short
predictable
human-readable
scriptable
```

Avoid unnecessary complexity.

---

# Document 20: End-to-End Architecture & MVP Build Plan

## 20.1 Purpose

This document connects Documents 1–19 into the complete Atlas system.

## 20.2 Final Architecture

```text
                         DEVELOPER
                             │
                             ▼
                         TERMINAL
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
              Claude Code            Codex
                  │                     │
                  └──────────┬──────────┘
                             │
                             ▼
                      ATLAS RUNTIME
                             │
                 ┌───────────┼───────────┐
                 │           │           │
                 ▼           ▼           ▼
             Project      Session     Agent
           Intelligence   Manager     Adapter
                 │           │           │
                 └───────────┼───────────┘
                             ▼
                      CONTEXT ENGINE
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
             Memory Engine       Retrieval Engine
                  │                     │
                  └──────────┬──────────┘
                             ▼
                       COCKROACHDB
                    ┌────────┴────────┐
                    │                 │
              Structured Data    Vector Index
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                         AWS LAYER
                    ┌────────┼────────┐
                    │        │        │
                    ▼        ▼        ▼
                Bedrock   Lambda      S3
```

## 20.3 The Auto-Fire Loop

```text
1. Developer opens terminal.

2. Developer types:
   claude
   or
   codex

3. Atlas runtime detects the agent.

4. Atlas identifies:
   - current directory
   - repository
   - workspace
   - branch
   - project

5. Atlas loads cached context.

6. Atlas retrieves fresh relevant memories.

7. Context Engine ranks memories.

8. Atlas prepares agent-specific context.

9. Coding agent starts.

10. Developer works normally.

11. Atlas captures meaningful events.

12. Important information becomes memory.

13. Session ends.

14. Atlas generates a handoff.

15. Future session retrieves that context.
```

## 20.4 MVP

The MVP should not attempt to build every feature immediately.

### MVP must include:

```text
✓ Local Atlas runtime
✓ Terminal auto-detection
✓ Claude Code integration
✓ Codex integration
✓ Git repository detection
✓ Project detection
✓ Session tracking
✓ Basic memory capture
✓ Memory search
✓ CockroachDB persistence
✓ CockroachDB vector search
✓ Context retrieval
✓ Startup context
✓ Session handoff
✓ Basic project dashboard
```

## 20.5 MVP Demo

The hackathon demo should be extremely simple.

### Scene 1

Developer opens:

```bash
cd ~/projects/demo
claude
```

Atlas automatically appears:

```text
ATLAS ✓

Welcome back.

Project:
Demo

Last focus:
Authentication

Open task:
Finish refresh-token handling.

Context loaded.
```

### Scene 2

Developer asks Claude:

```text
Let's finish the authentication work.
```

Claude receives relevant Atlas context.

### Scene 3

Developer makes an architectural decision:

```text
We'll keep refresh tokens in secure HTTP-only cookies.
```

Atlas recognizes this as important.

### Scene 4

Developer exits.

Atlas creates:

```text
SESSION HANDOFF

Completed:
Authentication middleware

Decision:
Refresh tokens use secure HTTP-only cookies.

Next:
Add integration tests.
```

### Scene 5

Later, start Codex:

```bash
codex
```

Atlas automatically fires again.

```text
ATLAS ✓

WELCOME BACK

Authentication

Last decision:
Refresh tokens use secure HTTP-only cookies.

Next:
Add integration tests.

Context loaded.
```

This demonstrates the central idea.

## 20.6 Hackathon Story

The pitch should not be:

> "We built another AI memory database."

Instead:

> **"Atlas gives coding agents a memory of where you left off."**

The database is the infrastructure.

The experience is the product.

## 20.7 What Makes Atlas Different

Most AI coding tools focus on:

```text
Write code
Fix code
Explain code
```

Atlas focuses on:

```text
Remember the developer.
Remember the project.
Remember why decisions were made.
Remember where work stopped.
Bring that context back automatically.
```

## 20.8 The Selling Point

The strongest feature is:

> **You don't open Atlas. Atlas opens with you.**

The developer doesn't need to change their workflow.

They simply:

```bash
claude
```

or:

```bash
codex
```

and Atlas is already there.

## 20.9 Long-Term Product Vision

Atlas eventually becomes a persistent intelligence layer across coding environments.

```text
             ATLAS
                │
     ┌──────────┼──────────┐
     │          │          │
 Claude Code   Codex    Future Agents
     │          │          │
     └──────────┼──────────┘
                │
          Project Memory
                │
       ┌────────┼────────┐
       │        │        │
     Tasks   Decisions  History
       │        │        │
       └────────┼────────┘
                │
          Context Engine
                │
          CockroachDB
```

## 20.10 Final Product Principle

Atlas should not try to become the developer's coding agent.

Claude Code and Codex already do that.

Atlas should become the layer that answers:

> **"What happened before I got here?"**

and:

> **"What should I know before I continue?"**

That is the foundation of Atlas.
