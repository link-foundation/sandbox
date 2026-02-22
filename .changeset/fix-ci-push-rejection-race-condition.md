---
bump: patch
---

Fix CI failure: `git push` rejected due to race condition with release workflow (Issue #51)

The "Measure Disk Space and Update README" workflow takes ~18 minutes to run. When a PR
is merged to `main`, the release workflow runs simultaneously and pushes a version bump
commit within seconds. After 18 minutes of valid measurement computation, the push step
failed with:

  ! [rejected] main -> main (fetch first)
  error: failed to push some refs to 'https://github.com/link-foundation/sandbox'

Fix: add `git pull --rebase origin main` before `git push origin main` in the "Commit
and push changes" step. Measurement data (README.md, data/) and version bumps (VERSION)
touch different files, so the rebase always succeeds cleanly.
