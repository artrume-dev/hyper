---
description: Comprehensive code review of recent changes
allowed-tools: Read, Grep, Diff, Bash(git *)
---

# Code Review

Perform a comprehensive code review of the most recent changes in this repository.

## Steps

1. **Identify Recent Changes**
   - Run `git status` to see unstaged/staged changes
   - Run `git diff` to see unstaged changes
   - Run `git diff --staged` to see staged changes
   - If no changes, run `git log -1 --stat` to review the last commit

2. **Review Focus Areas** (in priority order)
   - **Critical Issues**: Logic errors, bugs, potential crashes, edge cases
   - **Security**: Vulnerabilities, injection risks, authentication/authorization issues, data exposure
   - **Performance**: Inefficient algorithms, unnecessary operations, memory leaks, database N+1 queries
   - **Code Quality**: 
     - Readability and maintainability
     - Proper error handling
     - Code duplication (DRY principle)
     - Naming conventions and clarity
     - Function/method length and complexity
   - **Best Practices**: 
     - Language-specific idioms
     - Design patterns
     - SOLID principles
     - Test coverage

3. **Provide Feedback**
   - List any critical issues first with severity level (CRITICAL/HIGH/MEDIUM/LOW)
   - For each issue, provide:
     - Clear description of the problem
     - Location (file and line numbers)
     - Suggested fix or improvement
     - Rationale
   - Highlight positive aspects of the code
   - Suggest refactoring opportunities

4. **Summary**
   - Overall code quality assessment
   - Priority action items
   - Recommended next steps

## Output Format

Use clear headers and bullet points. Be constructive and specific. Focus on teaching and improvement, not just criticism.
