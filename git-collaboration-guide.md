# Git Collaboration Guide for Smart Pantry App

This document outlines common Git commands and workflows for our team collaboration on the Smart Pantry app project.

## Table of Contents
- [Setup](#setup)
- [Basic Commands](#basic-commands)
- [Branch Management](#branch-management)
- [Pull Requests (PRs)](#pull-requests-prs)
- [Keeping Your Branch Updated](#keeping-your-branch-updated)
- [Resolving Conflicts](#resolving-conflicts)
- [Best Practices](#best-practices)

## Setup

### Cloning the Repository
```bash
git clone https://github.com/username/smart-pantry-app.git
cd smart-pantry-app
```

### Configuring Your Identity
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Basic Commands

### Checking Status
See which files are modified, staged, or untracked:
```bash
git status
```

### Viewing Changes
See what changed in your files:
```bash
git diff                 # Changes in unstaged files
git diff --staged        # Changes in staged files
```

### Adding Files
Stage files for commit:
```bash
git add filename.js       # Add specific file
git add src/              # Add all files in directory
git add .                 # Add all files in current directory
```

### Committing Changes
Save staged changes to history:
```bash
git commit -m "Brief description of changes"
```

Use a detailed commit message for complex changes:
```bash
git commit
```
This opens your default editor. First line: brief summary (50 chars max). Skip a line, then add detailed explanation.

### Viewing Commit History
```bash
git log                  # Full history
git log --oneline        # Compact history
git log --graph          # Visualize branches
```

## Branch Management

### Viewing Branches
```bash
git branch               # List local branches
git branch -a            # List all branches (local + remote)
```

### Creating Branches
Always branch from main/master for new features:
```bash
git checkout main                     # Switch to main branch first
git pull                              # Get latest changes
git checkout -b feature/pantry-scan   # Create and switch to new branch
```

Name branches with a consistent pattern:
- `feature/feature-name`
- `bugfix/issue-description`
- `hotfix/urgent-fix`

### Switching Branches
```bash
git checkout branch-name
```

### Pushing a New Branch
First time pushing a branch to remote:
```bash
git push -u origin feature/pantry-scan
```
After the first push:
```bash
git push
```

### Deleting Branches
```bash
git branch -d branch-name       # Delete local branch (if merged)
git branch -D branch-name       # Force delete local branch
git push origin --delete branch-name  # Delete remote branch
```

## Pull Requests (PRs)

### Creating a Pull Request
1. Push your branch to the remote repository:
   ```bash
   git push -u origin your-branch-name
   ```

2. Go to the repository on GitHub/GitLab/etc.
3. Click "New Pull Request" or "Create Pull Request"
4. Select your branch as the source and main/master as the target
5. Fill in the PR template with:
   - What the PR does
   - Related issue numbers
   - Testing done
   - Screenshots (if UI changes)

### PR Best Practices
- Keep PRs focused and reasonably sized (ideally <300 lines of code)
- Write clear descriptions
- Respond to reviewer comments promptly
- Request specific reviewers who are familiar with the code area

## Keeping Your Branch Updated

### Fetching Updates
Get remote changes without applying them:
```bash
git fetch origin
```

### Updating Your Feature Branch from Main
Method 1: Merge (creates a merge commit, preserves history)
```bash
git checkout your-feature-branch
git fetch origin
git merge origin/main
```

Method 2: Rebase (cleaner history, but rewrites commits)
```bash
git checkout your-feature-branch
git fetch origin
git rebase origin/main
```

### Handling Updates During a PR
If changes are requested on your PR or main has been updated:
```bash
# Update with latest changes from main
git checkout main
git pull
git checkout your-feature-branch
git merge main

# Make requested changes
# ...make your code changes...
git add .
git commit -m "Address PR feedback"
git push
```

## Resolving Conflicts

When Git can't automatically merge changes:

1. Git will mark conflicts in files like:
   ```
   <<<<<<< HEAD
   your code
   =======
   their code
   >>>>>>> branch-name
   ```

2. Manually edit files to resolve conflicts:
   - Find all conflict markers (search for `<<<<<<<`)
   - Choose which code to keep or merge both
   - Remove conflict markers

3. After resolving:
   ```bash
   git add .
   git commit       # If during a merge
   git rebase --continue  # If during a rebase
   ```

## Best Practices

### Commit Messages
- Use the imperative mood: "Add feature" not "Added feature"
- First line: concise summary (50 chars max)
- If needed, add detailed explanation after a blank line
- Reference issue numbers: "Fix pantry scanning #42"

### Commit Frequency
- Commit logical chunks of work
- Commit often to create checkpoints
- Avoid giant commits that mix multiple features/fixes

### Keeping History Clean
Before pushing:
```bash
git rebase -i origin/main
```
This lets you squash similar commits, rewrite commit messages, etc.

### Branch Hygiene
- Delete branches after they're merged
- Keep branches focused on single features or fixes
- Regularly update from main/master

### Stashing Changes
Save uncommitted changes temporarily:
```bash
git stash       # Quick stash
git stash push -m "Description of changes"  # Stash with message
git stash list  # List all stashes
git stash apply # Apply most recent stash without removing it
git stash pop   # Apply most recent stash and remove it
```

### Git Aliases
Set up shortcuts for common commands in your `.gitconfig`:
```
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
```
