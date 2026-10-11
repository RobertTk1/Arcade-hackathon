@AGENTS.md

## Work in your own worktree

Several Claude sessions share this repo's main checkout, and two sessions in one checkout race over the branch and working tree. This has destroyed uncommitted work before.

- Before starting any new work that edits files or commits, create your own isolated worktree with the `EnterWorktree` tool (give it a short descriptive name). Read-only questions don't need one.
- Do all edits, builds and commits inside that worktree. Don't run git against the shared checkout from inside it.
- When the work is finished and merged or pushed, prune it. Leave with `ExitWorktree` using `action: "remove"`. If it refuses because of unmerged commits or uncommitted files, confirm with the user before using `discard_changes`.
- If you need to leave the worktree before finishing (for example to update the main checkout), use `action: "keep"` and remove it afterwards with `git worktree remove <path>` and `git branch -D <branch>`.
- A worktree has no `node_modules`. Run `npm ci` inside it before building. Don't symlink the shared one; Turbopack rejects it.
- Merge to `main` and push when the task is done, per the usual flow.
