---
description: Show the Atlas memory welcome box — last session, open tasks, key decisions, and suggested next action for this repository.
allowed-tools: mcp__atlas-memory__atlas_get_repository_context, mcp__atlas-memory__atlas_get_open_tasks, mcp__atlas-memory__atlas_get_recent_sessions
---

Call `atlas_get_repository_context` with the current working directory as `repoPath`, then call `atlas_get_open_tasks` and `atlas_get_recent_sessions` (limit 3) with the same path. Render the results as a single formatted block using this layout:

```
╔══════════════════════════════════════════════════╗
║  ATLAS — <repo name>                             ║
╠══════════════════════════════════════════════════╣
║  Last session: <summary or "first session">      ║
║  Agent: <agentId>  ·  <date>                    ║
╠══════════════════════════════════════════════════╣
║  Open tasks (<count>)                            ║
║  [1] <kind>: <content>  (importance: N)          ║
║  [2] ...                                         ║
╠══════════════════════════════════════════════════╣
║  Recent decisions                                ║
║  • <title> — <rationale (first sentence)>        ║
╠══════════════════════════════════════════════════╣
║  Suggested next:                                 ║
║  → <suggestions[0].action>                       ║
╚══════════════════════════════════════════════════╝
```

Rules:
- If no Atlas data exists for this repo yet, print: "No Atlas memory for this repo yet. Start a session with atlas_start_session to begin tracking."
- Truncate any field to 60 chars with "…" if longer
- Show at most 5 open tasks and 3 decisions
- Do not print anything outside the box
- Do not call atlas_start_session — this command is read-only
