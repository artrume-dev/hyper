---
description: Stage changes, create conventional commit, and push to remote
argument-hint: [optional commit message]
allowed-tools: Bash(git *)
---

# Commit and Push Changes

Stage all changes, create a conventional commit with a meaningful message, and push to the remote repository.

## Steps

1. **Review Changes**
   - Run `git status` to see all modified, added, and deleted files
   - Run `git diff` to review the actual changes

2. **Analyze Changes**
   - Determine the appropriate conventional commit type:
     - `feat:` New features or functionality
     - `fix:` Bug fixes
     - `docs:` Documentation changes only
     - `style:` Formatting, white-space, missing semi-colons (no code change)
     - `refactor:` Code restructuring without changing behavior
     - `perf:` Performance improvements
     - `test:` Adding or updating tests
     - `chore:` Maintenance tasks, dependency updates, tooling
     - `ci:` CI/CD configuration changes
     - `build:` Build system or external dependency changes
     - `revert:` Reverting a previous commit

3. **Stage All Changes**
   - Run `git add -A` to stage all changes

4. **Create Commit**
   - If $ARGUMENTS is provided, use it as the commit message
   - If no arguments, analyze the changes and create a descriptive conventional commit message
   - Message format: `<type>: <short description>`
   - Example: `feat: add user authentication with JWT tokens`
   - Keep the description clear, concise, and in present tense
   - Do NOT add co-authors or trailers to the commit message

5. **Push to Remote**
   - Get the current branch name with `git branch --show-current`
   - Push to the remote branch with `git push origin <branch-name>`
   - If the branch doesn't exist on remote, use `git push -u origin <branch-name>`

6. **Confirm Success**
   - Report the commit hash and message
   - Confirm successful push to remote
   - Show the branch status

## Important Notes

- Follow Conventional Commits specification (https://www.conventionalcommits.org/)
- Use present tense in commit messages ("add feature" not "added feature")
- Keep commit messages under 72 characters for the subject line
- If push fails (e.g., needs pull first), provide clear guidance on how to resolve
