---
description: Summarize the last completed feature with changes and impact
allowed-tools: Bash(git *), Read, Grep
---

# Last Feature Completed

Generate a comprehensive summary of the most recently completed feature, including all related commits, files changed, and overall impact.

## Steps

1. **Identify Recent Feature Work**
   - Run `git log --all --grep="feat:" --pretty=format:"%H|%s|%cr|%an" -20` to find recent feature commits
   - Run `git log --all --branches --pretty=format:"%H|%s|%cr|%an" -20` to find recent branch activity
   - Look for merged feature branches with `git branch -a --merged --format="%(refname:short)|%(committerdate:relative)"`
   - Identify the most recent feature by:
     - Latest "feat:" commit
     - Recently merged feature/* or feature- branches
     - PR merge commits mentioning features

2. **Analyze Feature Scope**
   - Get the commit hash of the feature start and end
   - If it's a feature branch merge, find all commits in that feature
   - Run `git log <start>..<end> --oneline` to see all related commits
   - Run `git diff <start>..<end> --stat` to see file changes
   - Run `git show <merge-commit>` if it was a branch merge

3. **Extract Feature Details**
   - Feature name/title from commit message or branch name
   - Feature description from commit body or PR description
   - Developer(s) who worked on it
   - When it was completed (commit date)
   - Related commits and their purposes (feat, fix, refactor, test, docs)

4. **Analyze Changes**
   - List all files modified, added, or deleted
   - Categorize changes:
     - Core implementation files
     - Tests added/modified
     - Documentation updates
     - Configuration changes
   - Calculate statistics (files changed, lines added/removed)

5. **Assess Impact**
   - What functionality was added or changed
   - Which parts of the codebase were affected
   - Whether tests were included
   - Whether documentation was updated

6. **Generate Feature Summary Report**

## Output Format

### 🎯 Last Completed Feature

**Feature**: [Feature name/title]  
**Completed**: [date/time ago]  
**Developer(s)**: [name(s)]  
**Branch**: [branch name if applicable]

---

### 📋 Feature Description
[Brief description of what the feature does and why it was needed]

---

### 🔨 Implementation Details

#### Related Commits
1. `[hash]` - [commit message] ([time ago])
2. `[hash]` - [commit message] ([time ago])
3. ...

#### Files Changed ([count] files)
**Core Implementation:**
- `[filename]` - [brief description of changes]
- ...

**Tests:**
- `[test filename]` - [what was tested]
- ...

**Documentation:**
- `[doc filename]` - [what was documented]
- ...

**Other:**
- `[filename]` - [description]
- ...

---

### 📊 Statistics
- **Total Commits**: [count]
- **Files Changed**: [count]
- **Lines Added**: [count]
- **Lines Removed**: [count]
- **Test Coverage**: [Yes/No/Partial]
- **Documentation Updated**: [Yes/No]

---

### 💡 Key Highlights
- [Important aspect of the feature]
- [Notable technical decision or implementation detail]
- [Any interesting challenges solved]
- ...

---

### 🎨 Feature Impact
- **User-Facing Changes**: [What users will see/experience]
- **Internal Changes**: [Backend/architecture improvements]
- **Dependencies**: [New dependencies or updated packages]
- **Breaking Changes**: [Any breaking changes, or "None"]

---

### 📝 Summary for Documentation
[A concise 2-3 sentence summary suitable for changelog, release notes, or sprint review]

---

## Notes

- If no feature commits are found, check for recent significant work that might not be labeled as "feat:"
- Consider grouping multiple small related commits into one feature if they're part of the same story/ticket
- Look for issue/ticket references in commit messages (e.g., JIRA-123, #456)
- If multiple features are recent, focus on the most recently completed one
- Present information in a format suitable for:
  - Stand-up meetings
  - Sprint reviews
  - Release notes
  - Team updates
  - Documentation

## Alternative Strategies

If the standard approach doesn't find a clear feature:
- Look for the most recent merge commit: `git log --merges -1`
- Check for recent tags: `git describe --tags --abbrev=0`
- Analyze the last significant set of commits before the current date
- Ask the user to specify a commit range, branch name, or time period
