# /memory-dropoff

## Description
Create a comprehensive memory with like-i-said-memory and a comprehensive drop-off prompt that will enable me to start from the current state with the current tasks in a new chat/terminal.

## Usage
```
/memory-dropoff
```

## What This Command Should Do

### 1. Generate Project Memory
- Current project state and status
- File structure and key components
- Recent changes and implementations
- Configuration state (API keys, settings, etc.)
- Working features vs. pending tasks

### 2. Capture "Like I Said" Context
- User preferences explicitly stated during session
- Specific requirements and constraints mentioned
- Design decisions and rationale
- Style preferences and approaches chosen

### 3. Create Session Drop-off Prompt
- Complete context for new Claude Code session
- Copy-paste ready prompt with all necessary information
- Current working directory and file locations
- Commands to verify project state
- Next steps and pending tasks

### 4. Generate Continuity Package
- Summary of conversation highlights
- Key decisions made and why
- Technical architecture overview
- Dependencies and integrations
- Testing and deployment status

## Expected Output Format

```markdown
# Claude Code Session Memory & Drop-off

## Current Project Context
[Comprehensive project state]

## Like-I-Said Memory
[User preferences and explicit requirements]

## Drop-off Prompt for New Session
[Ready-to-paste context transfer]

## Quick Verification Commands
[Commands to check project status]

## Next Steps
[Pending tasks and priorities]
```

## Implementation Notes
- Should analyze current directory structure
- Capture recent git commits if applicable
- Include environment and dependency status
- Generate portable context that works across sessions
- Focus on actionable information for continuation

## Keywords
memory, continuity, session-transfer, context, drop-off, handover
