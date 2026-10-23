# ATLAS
## Documents 21–30: Memory Graph, Code Intelligence, Agent Tools, Autonomous Memory, Dashboard, Security, Production, Evaluation, and Final Hackathon Specification

**Project:** Atlas  
**Documents:** 21–30  
**Status:** Product + Technical Specification  
**Version:** 1.0

---

# Document 21: Atlas Memory Graph & Relationship Engine

## 21.1 Purpose

Atlas should not treat memories as isolated records.

Software development is relational.

A decision affects a task.
A task affects files.
A file change belongs to a session.
A session produces a discovery.
A discovery can change an architecture decision.

Atlas should understand those relationships.

## 21.2 Core Concept

```text
Memory
  │
  ├── Project
  ├── Workspace
  ├── Session
  ├── Task
  ├── File
  ├── Commit
  ├── Decision
  └── Document
```

## 21.3 Example

```text
Decision:
Use HTTP-only cookies

       ↓

Task:
Implement authentication

       ↓

Files:
src/auth/session.ts
src/auth/middleware.ts

       ↓

Session:
August 12

       ↓

Handoff:
Add integration tests
```

Atlas can then answer:

> Why does this file use HTTP-only cookies?

Instead of simply searching text, it can follow the relationship chain.

## 21.4 Memory Relationships

Potential relationship types:

```text
RELATED_TO
CREATED_BY
UPDATED_BY
DEPENDS_ON
SUPERSEDES
IMPLEMENTS
CAUSED
RESOLVES
MENTIONS
BLOCKS
COMPLETES
```

## 21.5 Relationship Example

```text
Memory A
"PostgreSQL was originally selected."

       ↓ SUPERSEDED_BY

Memory B
"CockroachDB replaced PostgreSQL."

       ↓ IMPLEMENTED_BY

Task
"Migrate database layer."

       ↓ CHANGED

Files
database.ts
schema.ts
```

## 21.6 Why This Matters

The memory graph lets Atlas answer questions such as:

```text
Why was this architecture chosen?
What task introduced this change?
Which files are affected?
What happened during the previous attempt?
What decision superseded this one?
```

## 21.7 Graph + Vector Search

Atlas should use both:

```text
Vector similarity
+
Structured relationships
```

Vector search finds related concepts.

The graph provides context and causality.

## 21.8 Graph Retrieval

Example:

```text
Current file:
retrieval/ranker.ts

       ↓

Related memories

       ↓

Previous ranking decision

       ↓

Related bug

       ↓

Previous fix
```

This produces much richer context than simple semantic search.

---

# Document 22: Atlas File & Code Intelligence

## 22.1 Purpose

Atlas should understand the repository itself.

It should know more than:

```text
"This is a TypeScript project."
```

It should understand:

```text
What files exist?
What are they responsible for?
What changed?
Which memories relate to them?
```

## 22.2 Repository Index

Atlas can maintain a lightweight project index:

```text
Repository
 ├── src
 │   ├── auth
 │   ├── memory
 │   ├── retrieval
 │   └── cli
 ├── docs
 └── tests
```

## 22.3 File Metadata

Potential metadata:

```text
path
language
size
last_modified
git_status
module
dependencies
importance
```

## 22.4 Code Relationships

Atlas can eventually understand:

```text
Function
Class
Module
Import
Dependency
API
Database table
Configuration
```

## 22.5 File-to-Memory Association

Example:

```text
src/auth/session.ts
        │
        ├── Authentication architecture
        ├── Session decision
        ├── Previous bug
        └── Security constraint
```

## 22.6 File-Aware Startup

If the developer is working in:

```text
src/auth/
```

Atlas should prioritize authentication-related memory.

## 22.7 Git Awareness

Atlas can inspect safe Git metadata:

```text
Current branch
Recent commits
Changed files
Commit messages
Uncommitted files
```

## 22.8 Commit Relationships

Example:

```text
Commit:
"refactor memory ranking"

       ↓

Files:
ranker.ts
retrieval.ts
tests/ranker.test.ts

       ↓

Related memory:
"Ranking should prioritize explicit decisions."
```

## 22.9 Code Change Detection

Atlas should recognize meaningful changes.

Example:

```text
Before:
PostgreSQL adapter

After:
CockroachDB adapter
```

This may trigger:

```text
Documentation drift detection
Architecture review
Memory update candidate
```

## 22.10 Security

Atlas should not automatically index:

```text
.env
private keys
credentials
secret files
```

Sensitive-file rules must be configurable.

---

# Document 23: Atlas Agent Interaction & Tool Layer

## 23.1 Purpose

Startup context is useful, but Atlas should also be queryable during an active coding session.

The agent should be able to ask Atlas:

```text
What do we remember?
Why was this decision made?
What did we do last session?
```

## 23.2 Conceptual Tools

Atlas should expose capabilities such as:

```text
search_memory
get_memory
get_project_context
get_handoff
search_project
get_related_files
save_memory
update_memory
```

The final mechanism should use the appropriate supported agent integration.

## 23.3 Example

Developer:

> Why are we using this database abstraction?

Agent:

```text
Atlas memory:
The abstraction was introduced to support
database portability during the initial migration.
```

## 23.4 Explicit Retrieval

Developer:

```text
Atlas, search our previous sessions for
authentication decisions.
```

Atlas returns relevant context.

## 23.5 Saving Memory

Developer:

```text
Remember that all authentication state must
remain server-side.
```

Atlas stores the memory.

## 23.6 Project Context

The agent can request:

```text
get_project_context()
```

and receive:

```text
Project summary
Current focus
Important decisions
Open tasks
Known issues
Recent handoff
```

## 23.7 Handoff Retrieval

```text
get_handoff()
```

returns the latest relevant session handoff.

## 23.8 Tool Permissions

Not every agent action should have unrestricted access.

Capabilities should be permission-aware:

```text
READ
SEARCH
WRITE
UPDATE
ADMIN
```

## 23.9 Audit Trail

Atlas should record important tool actions:

```text
Agent:
Claude Code

Action:
search_memory

Project:
Atlas

Time:
...

Result count:
8
```

## 23.10 Agent Independence

The underlying memory remains:

```text
Atlas
```

not:

```text
Claude memory
```

or:

```text
Codex memory
```

This makes cross-agent continuity possible.

---

# Document 24: Atlas Autonomous Memory Agent

## 24.1 Purpose

The Autonomous Memory Agent processes development activity and determines what deserves long-term memory.

## 24.2 Responsibilities

It can:

```text
Classify information
Detect decisions
Detect important discoveries
Generate summaries
Create handoffs
Detect outdated memories
Suggest documentation updates
Link related memories
```

## 24.3 Event Flow

```text
Developer activity
        ↓
Event collector
        ↓
Candidate memory
        ↓
AI analysis
        ↓
Classification
        ↓
Importance
        ↓
Confidence
        ↓
Memory graph
        ↓
CockroachDB
```

## 24.4 AI Should Not Control Everything

Deterministic logic should handle:

```text
Git branch
Repository
File path
Session timestamps
Project identity
```

AI should handle:

```text
Meaning
Classification
Summarization
Importance
Relationship discovery
```

## 24.5 Memory Candidate

Example:

```text
Developer:
"We're going to use vector search for long-term memory."
```

AI returns:

```text
Type:
DECISION

Importance:
HIGH

Confidence:
HIGH

Title:
Use vector search for long-term memory.
```

## 24.6 Contradiction Detection

The agent searches existing memory.

If it finds:

```text
Previous:
Use keyword search only.
```

it marks the previous decision as potentially superseded.

## 24.7 Documentation Detection

If an architecture change occurs:

```text
Code changed
      ↓
Memory agent
      ↓
README mismatch detected
      ↓
Documentation suggestion
```

## 24.8 Background Processing

The memory agent should run asynchronously whenever possible.

The developer should not wait for memory processing.

## 24.9 Human Control

Users should be able to:

```text
Delete memory
Edit memory
Mark important
Mark irrelevant
Disable automatic capture
```

---

# Document 25: Atlas Project Intelligence Dashboard

## 25.1 Purpose

The dashboard is the visual layer where developers can understand everything Atlas knows about their work.

It should not look like a generic AI dashboard.

It should feel like a developer command center.

## 25.2 Home Screen

The home screen can show:

```text
ATLAS

Good evening.

3 active projects

Atlas
Authentication work

SyncSpace
Tab synchronization

Demo
API refactor
```

## 25.3 Project Cards

Each project can display:

```text
Project
Last active
Current task
Open tasks
Important memories
Last session
Health
```

## 25.4 Important Projects

Developers can mark projects:

```text
IMPORTANT
```

These should appear prominently.

## 25.5 Project Overview

```text
ATLAS PROJECT

Current focus:
Memory retrieval

Open:
4 tasks

Important decisions:
12

Sessions:
37

Last activity:
3 hours ago
```

## 25.6 Memory Timeline

A timeline can show:

```text
Aug 12
Decision made

Aug 11
Authentication completed

Aug 10
Architecture changed

Aug 08
Bug discovered
```

## 25.7 Session History

Users can browse:

```text
Today
Yesterday
Last week
Older
```

Each session can display:

```text
Agent
Project
Focus
Duration
Completed
Remaining
```

## 25.8 Memory Explorer

Users should be able to search:

```text
authentication
database
retrieval
deployment
```

and filter by:

```text
Project
Type
Importance
Date
Status
Agent
```

## 25.9 Project Graph

Atlas can visualize relationships:

```text
Project
   │
   ├── Tasks
   ├── Decisions
   ├── Files
   ├── Sessions
   └── Memories
```

## 25.10 Dashboard Principle

The dashboard should support understanding, not overwhelm the user.

The most important information should be visible immediately.

---

# Document 26: Atlas Personal Developer Memory

## 26.1 Purpose

Atlas should eventually understand the developer separately from individual projects.

This allows Atlas to remember stable working preferences without mixing them into project memory.

## 26.2 Separation

```text
Developer Memory
       │
       ├── Project A
       ├── Project B
       └── Project C
```

Project-specific memory stays inside its project.

## 26.3 Examples

A developer may prefer:

```text
TypeScript
```

or:

```text
concise commit messages
```

or:

```text
tests before refactoring
```

These can be developer-level preferences when explicitly established.

## 26.4 Project Isolation

A project-specific decision:

```text
Atlas uses CockroachDB.
```

should not automatically become:

```text
All future projects use CockroachDB.
```

## 26.5 Preference Confidence

Atlas should distinguish:

```text
Explicit preference
```

from:

```text
Observed pattern
```

Observed behavior should not automatically become a permanent preference.

## 26.6 User Control

Users should be able to:

```text
View preferences
Edit
Delete
Disable
```

## 26.7 Privacy Principle

Personal memory should never be injected into an unrelated project unless it is genuinely relevant and permitted.

---

# Document 27: Atlas Security, Privacy & Memory Isolation

## 27.1 Purpose

Atlas stores potentially valuable development information.

Security must be part of the architecture.

## 27.2 Core Security Principles

```text
Least privilege
Project isolation
Encryption
Auditability
User control
Safe defaults
```

## 27.3 Authentication

Users authenticate Atlas before accessing cloud memory.

The local runtime should use secure credentials.

## 27.4 Authorization

Every request should be evaluated against:

```text
User
Project
Repository
Workspace
Agent
Operation
```

## 27.5 Memory Isolation

Project A must never accidentally receive Project B's memory.

Example:

```text
Project A
   X
Project B memory
```

## 27.6 Agent Isolation

Claude Code and Codex may share memory only when the user has access to the same project.

## 27.7 Secret Detection

Atlas should detect or exclude common sensitive content:

```text
API keys
Private keys
Passwords
Tokens
.env files
Credentials
```

## 27.8 Sensitive Files

Default exclusions should include:

```text
.env
.env.*
credentials.*
*.pem
*.key
secret files
```

Exact patterns should be configurable.

## 27.9 Encryption

Sensitive data should be encrypted:

```text
In transit
At rest
```

## 27.10 Audit Logs

Important actions should be logged:

```text
Memory created
Memory accessed
Memory deleted
Agent query
Project access
Configuration change
```

## 27.11 Deletion

Users must be able to delete:

```text
Memory
Session
Project
Account
```

Deletion behavior should be explicit and documented.

## 27.12 Safe Retrieval

Before context injection:

```text
Authorization
     ↓
Project isolation
     ↓
Sensitive-data filter
     ↓
Relevance
     ↓
Context
```

---

# Document 28: Atlas Distributed & Production Architecture

## 28.1 Purpose

The MVP can start small, but Atlas should have a path to production scale.

## 28.2 Production Architecture

```text
Developer
   ↓
Atlas Runtime
   ↓
API / Gateway
   ↓
Application Services
   ├── Context Service
   ├── Memory Service
   ├── Project Service
   ├── Session Service
   └── Agent Integration Service
             │
             ▼
        CockroachDB
             │
        Vector Index
             │
             ▼
             AWS
       ┌─────┼─────┐
       ↓     ↓     ↓
   Bedrock Lambda S3
```

## 28.3 CockroachDB

CockroachDB serves as the durable system of record for:

```text
Users
Projects
Sessions
Memories
Tasks
Decisions
Relationships
Embeddings
Events
```

## 28.4 AWS Lambda

Lambda handles asynchronous jobs:

```text
Memory processing
Embeddings
Summaries
Handoffs
Documentation analysis
```

## 28.5 Amazon Bedrock

Bedrock provides model access for reasoning-heavy tasks.

## 28.6 Amazon S3

S3 stores larger artifacts when required.

## 28.7 Caching

Atlas can use caching for:

```text
Recent context
Project summaries
Recent sessions
Frequently retrieved memories
```

## 28.8 Event Processing

Long-running or asynchronous operations should be event-driven.

Example:

```text
Session ends
   ↓
Event
   ↓
Queue
   ↓
Lambda
   ↓
Bedrock
   ↓
CockroachDB
```

## 28.9 Observability

Track:

```text
Latency
Errors
AI calls
Database queries
Memory retrieval
Cache performance
Agent integrations
```

## 28.10 Failure Recovery

Atlas should degrade gracefully.

If Bedrock is unavailable:

```text
Basic memory retrieval
```

can still work.

If cloud memory is temporarily unavailable:

```text
Local cached context
```

can still provide limited continuity.

## 28.11 Scaling Principle

The local runtime should remain lightweight.

Heavy processing belongs in the cloud.

---

# Document 29: Atlas Intelligence, Evaluation & Trust System

## 29.1 Purpose

Atlas should prove that memory actually helps developers.

The goal is not simply to store more data.

## 29.2 Core Question

> Did Atlas give the agent useful information at the right time?

## 29.3 Retrieval Metrics

Measure:

```text
Retrieval precision
Retrieval relevance
Context usefulness
False-memory rate
Stale-memory rate
```

## 29.4 Memory Metrics

Measure:

```text
Useful memories created
Duplicate memories
Incorrect memories
Superseded memories
Memory correction rate
```

## 29.5 Context Metrics

Measure:

```text
Startup latency
Context size
Context acceptance
Context rejection
Repeated-question reduction
```

## 29.6 Agent Performance

Potential evaluation:

```text
Without Atlas
vs
With Atlas
```

Measure:

```text
Time to complete task
Number of repeated explanations
Number of wrong assumptions
Number of relevant previous decisions used
```

## 29.7 Benchmark Tasks

Create test scenarios such as:

```text
Task 1:
Continue unfinished feature.

Task 2:
Explain an old architecture decision.

Task 3:
Fix a previously encountered bug.

Task 4:
Continue work using a different coding agent.

Task 5:
Avoid a previously rejected implementation.
```

## 29.8 Trust System

Atlas should explain why memory was surfaced.

Example:

```text
Why this memory?

Same project
Same workspace
Related task
High importance
Recent
```

## 29.9 Confidence

The agent should not state uncertain memory as fact.

Example:

```text
Atlas found a low-confidence note suggesting
Redis was previously considered.
```

rather than:

```text
The project uses Redis.
```

## 29.10 Evaluation Dashboard

Eventually:

```text
ATLAS QUALITY

Memory usefulness:
92%

Retrieval precision:
88%

False-memory rate:
1.4%

Average context latency:
210ms
```

Numbers shown here are illustrative only.

## 29.11 Continuous Improvement

```text
Retrieval
   ↓
User feedback
   ↓
Evaluation
   ↓
Ranking improvements
   ↓
Better retrieval
```

---

# Document 30: Atlas Final Product Specification & Hackathon Demo

## 30.1 Final Product

Atlas is a persistent memory layer for terminal-based AI coding agents.

Initial agents:

```text
Claude Code
Codex
```

The defining experience:

```text
Developer opens terminal
        ↓
Starts claude / codex
        ↓
Atlas automatically fires
        ↓
Understands where the developer is
        ↓
Retrieves relevant project memory
        ↓
Provides context
        ↓
Developer continues coding
```

## 30.2 The Product Story

Do not pitch Atlas as:

> Another AI memory database.

Pitch it as:

> **The memory layer that makes your coding agent remember where you left off.**

## 30.3 Strongest Demo Moment

Start with:

```bash
cd ~/projects/atlas
claude
```

Atlas automatically appears:

```text
ATLAS ✓

WELCOME BACK

Project:
Atlas

Last focus:
Memory retrieval

Completed:
Candidate scoring

Still open:
Ranking tests

Important:
CockroachDB is the persistent memory layer.

Context loaded.
```

Then use Claude Code.

Exit.

Later:

```bash
cd ~/projects/atlas
codex
```

Atlas automatically appears again:

```text
ATLAS ✓

WELCOME BACK

You were working on:
Memory retrieval

Previous decision:
Use hybrid structured + vector retrieval.

Next:
Add ranking tests.

Context loaded.
```

This demonstrates cross-agent continuity.

## 30.4 CockroachDB Demonstration

The demo should explicitly show that Atlas is using CockroachDB.

Show:

```text
Session
   ↓
Memory
   ↓
Embedding
   ↓
CockroachDB
   ↓
Vector retrieval
   ↓
Context
   ↓
Coding agent
```

## 30.5 CockroachDB Features

The recommended hackathon submission should use at least:

```text
CockroachDB Cloud Managed MCP Server
Distributed Vector Indexing
```

Optionally:

```text
ccloud CLI
Agent Skills
```

## 30.6 AWS Demonstration

Show at least one meaningful AWS service.

Recommended:

```text
Amazon Bedrock
AWS Lambda
```

Example:

```text
Session ends
   ↓
Lambda
   ↓
Bedrock
   ↓
Generate handoff
   ↓
CockroachDB
```

## 30.7 Architecture Diagram

Final presentation architecture:

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
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Project          Session          Agent Adapter
 Intelligence       Manager
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                 CONTEXT ENGINE
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        Memory Engine       Retrieval Engine
              │                   │
              └─────────┬─────────┘
                        ▼
                  COCKROACHDB
               ┌────────┴────────┐
               ▼                 ▼
          Structured         Vector Index
            Memory
               │                 │
               └────────┬────────┘
                        ▼
                       AWS
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Bedrock   Lambda       S3
```

## 30.8 Hackathon Requirements Checklist

### Open Source

Repository must contain:

```text
Source code
README
License
Setup instructions
Configuration examples
Dependencies
Example data
```

### Functional Demo

Provide:

```text
Working application
Public demo
```

### Video

Keep the demonstration under the required video duration.

The video should show:

```text
Install
Auto-fire
Project detection
Memory retrieval
Agent interaction
Memory creation
Session handoff
Return session
CockroachDB
AWS
```

## 30.9 Three-Minute Demo Structure

### 0:00–0:25

Explain the problem:

```text
AI coding agents forget.

Developers repeatedly explain the same project,
decisions, and unfinished work.
```

### 0:25–0:55

Start Claude Code:

```bash
claude
```

Atlas automatically fires.

Show project context.

### 0:55–1:25

Make an important architecture decision.

Atlas captures it.

### 1:25–1:45

End the session.

Show automatic handoff.

### 1:45–2:15

Start Codex later.

Atlas automatically fires.

Show the same memory.

### 2:15–2:40

Show CockroachDB:

```text
Structured memory
+
Vector index
```

### 2:40–3:00

Show AWS/Bedrock/Lambda processing and close with:

> "Atlas doesn't replace your coding agent. It gives it something it has always been missing: memory."

## 30.10 MVP Scope

The first working version should prioritize:

```text
1. Local Atlas runtime
2. Auto-fire detection
3. Claude Code adapter
4. Codex adapter
5. Project detection
6. Session tracking
7. Memory capture
8. Memory retrieval
9. CockroachDB persistence
10. Vector search
11. Context injection
12. Handoff generation
13. Bedrock processing
14. Lambda background jobs
15. Basic dashboard
```

Do not attempt to build every advanced feature before the core experience works.

## 30.11 Phase 1

```text
Terminal runtime
Project detection
Agent detection
Authentication
CockroachDB connection
```

## 30.12 Phase 2

```text
Memory model
Memory capture
Vector embeddings
Retrieval
Context engine
```

## 30.13 Phase 3

```text
Claude integration
Codex integration
Auto-fire
Session handoff
Cross-agent continuity
```

## 30.14 Phase 4

```text
Bedrock
Lambda
Documentation generation
Memory graph
```

## 30.15 Phase 5

```text
Dashboard
Security hardening
Evaluation
Observability
Demo polish
```

## 30.16 Final Atlas Experience

The complete experience should feel like this:

```text
Developer
    │
    │ types:
    │
    ├── claude
    │
    ▼
ATLAS
    │
    ├── "I know where you are."
    │
    ├── "I know what you were doing."
    │
    ├── "I know what decisions matter."
    │
    ├── "I know what remains."
    │
    └── "Here's what you need to continue."
    │
    ▼
CODING AGENT
    │
    ▼
Developer continues
```

## 30.17 Final Product Principle

Atlas should make returning to a project feel less like:

> "Where was I?"

and more like:

> "Welcome back. Here's where you left off."

That is the product.

# END OF DOCUMENTS 21–30
