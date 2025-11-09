# Claude Code Configuration for HyperGigs

This directory contains configuration files for Claude Code sub-agents and commands.

## 📁 Structure

```
.claude/
├── README.md                 # This file
├── PROJECT-SUMMARY.md        # Comprehensive project documentation
├── ui-agent.md              # UI/Frontend agent configuration
├── backend-agent.md         # Backend/API agent configuration
└── commands/
    ├── ui.md                # /ui slash command
    └── backend.md           # /backend slash command
```

## 🎯 Available Sub-Agents

### 1. UI Agent (`ui-agent.md`)
**Purpose:** Frontend/UI development specialist

**Expertise:**
- React component development (TypeScript + React 19)
- Tailwind CSS + shadcn/ui styling
- Forms (React Hook Form + Zod)
- State management (Zustand)
- Animations (Framer Motion)
- Responsive design & accessibility
- User experience optimization

**Invoke with:** `/ui`

**Example usage:**
```
/ui Create a new Settings page with tabs for Profile, Notifications, and Privacy
/ui Add a dark mode toggle to the navigation component
/ui Implement a loading skeleton for the freelancers page
/ui Create a modal dialog for confirming portfolio deletion
```

### 2. Backend Agent (`backend-agent.md`)
**Purpose:** Backend/API development specialist

**Expertise:**
- Express.js API development (TypeScript + Express 4)
- Prisma ORM & database management
- RESTful API design
- JWT authentication & authorization
- Service layer business logic
- Database migrations & schema design
- Request validation (express-validator)
- Error handling & security

**Invoke with:** `/backend`

**Example usage:**
```
/backend Create a new API endpoint for user notifications
/backend Add a Comment model to the database with relations to User and Post
/backend Implement pagination for the teams listing endpoint
/backend Add validation for the portfolio creation endpoint
/backend Create a service method to calculate user engagement metrics
```

## 📚 Key Documentation Files

### PROJECT-SUMMARY.md
**Purpose:** Complete codebase understanding for all agents

**Contents:**
- Project overview and architecture
- Technology stack details
- Database schema documentation
- API endpoints reference
- Frontend/backend structure
- Development guidelines
- Deployment information
- Common patterns and best practices

**When to read:**
- Before starting any new feature
- When understanding project context
- When looking for existing patterns
- When debugging complex issues

### ui-agent.md
**Purpose:** Detailed guidelines for UI development

**Contents:**
- React component patterns
- Styling conventions (Tailwind CSS)
- Form handling patterns
- State management examples
- Animation patterns
- Accessibility guidelines
- Performance optimization
- Testing guidelines
- Common UI tasks

**When to read:**
- Before creating new components
- When styling components
- When implementing forms
- When adding animations
- When ensuring accessibility

## 🚀 How to Use Sub-Agents

### Method 1: Slash Commands (Recommended)
```bash
# Invoke the UI agent
/ui [describe your UI task]

# Example
/ui Create a responsive card component for displaying team members
```

### Method 2: Direct Reference
```bash
# In your prompt, reference the agent file
@.claude/ui-agent.md Please create a new modal component for...
```

## 🎓 Quick Start Guide

### For UI Tasks:
1. Type `/ui` in the chat
2. Describe your UI task
3. The agent will:
   - Read PROJECT-SUMMARY.md for context
   - Follow ui-agent.md guidelines
   - Reference existing components
   - Create code following project patterns

### For Backend Tasks:
1. Create backend-agent.md (or use general agent)
2. Describe your backend task
3. The agent will handle API/database work

## 📝 Creating New Sub-Agents

### Step 1: Create Agent Configuration
Create a new file: `.claude/[agent-name]-agent.md`

**Template:**
```markdown
# [Agent Name] - HyperGigs [Role] Specialist

You are a specialized agent for [purpose].

## Core Responsibilities
- Responsibility 1
- Responsibility 2

## Project Context
[Relevant tech stack and file locations]

## Design Patterns to Follow
[Code examples and patterns]

## Resources
- **Project Summary**: `.claude/PROJECT-SUMMARY.md`
- **Relevant Files**: List key files
```

### Step 2: Create Slash Command
Create: `.claude/commands/[command-name].md`

**Template:**
```markdown
---
description: Brief description of what this command does
---

You are now acting as the **[Agent Name]** for the HyperGigs project.

**Read and follow the instructions in** `.claude/[agent-name]-agent.md`

**Also read** `.claude/PROJECT-SUMMARY.md` for project context.

[Additional instructions]

Now, please tell me what [type of task] you'd like me to help with.
```

## 💡 Best Practices

### For All Agents:
1. **Always read PROJECT-SUMMARY.md first** - Understand full context
2. **Reference existing code** - Look for similar patterns
3. **Follow TypeScript strictly** - No `any` types
4. **Test your changes** - All states and edge cases
5. **Document complex logic** - Add comments where needed

### For UI Agent:
- Mobile-first responsive design
- Accessibility (ARIA, keyboard navigation)
- Use shadcn/ui components consistently
- Follow Tailwind CSS patterns
- Test loading/error/success states

### For Backend Agent:
- API endpoint conventions (RESTful)
- Database migrations (Prisma)
- Input validation (express-validator)
- Error handling patterns
- Authentication checks

## 🔍 Troubleshooting

### Agent not loading context?
- Ensure PROJECT-SUMMARY.md is up to date
- Check file paths in agent configuration
- Verify slash command references correct agent file

### Inconsistent code style?
- Review existing code patterns in codebase
- Update agent configuration with better examples
- Ensure TypeScript types are properly defined

### Agent missing information?
- Update PROJECT-SUMMARY.md with new features
- Add relevant examples to agent configuration
- Document new patterns as they emerge

## 📊 Current Status

### Completed:
- ✅ PROJECT-SUMMARY.md - Complete project documentation (37 KB)
- ✅ ui-agent.md - Frontend specialist configuration (7.3 KB)
- ✅ /ui command - UI agent slash command
- ✅ backend-agent.md - Backend specialist configuration (21 KB)
- ✅ /backend command - Backend agent slash command
- ✅ README.md - This documentation file

### To Do:
- ⏳ /fullstack command - Full-stack feature agent
- ⏳ /test command - Testing specialist agent

## 🎯 Example Workflows

### Creating a New Feature (Full-Stack)
1. **Planning**: Review PROJECT-SUMMARY.md for architecture
2. **Backend**: Use `/backend` to create API endpoints, update schema
3. **Frontend**: Use `/ui` to create components
4. **Testing**: Test all states and edge cases
5. **Documentation**: Update relevant docs

### UI-Only Task
1. `/ui Create a new Settings page`
2. Agent reads ui-agent.md for patterns
3. Agent references existing pages
4. Agent creates component following guidelines
5. Agent ensures responsive design & accessibility

### Backend-Only Task
1. `/backend Create a new notifications API endpoint`
2. Agent reads backend-agent.md for patterns
3. Agent creates route → controller → service
4. Agent updates database schema if needed
5. Agent adds validation and error handling

---

**Last Updated:** October 14, 2025
**Project:** HyperGigs - Modern freelance platform
**Claude Code Version:** Latest
