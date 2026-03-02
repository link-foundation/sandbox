---
bump: patch
---

fix: make CI toolchain tests fatal and comprehensive (issue #62)

Previously, all toolchain test commands in `docker-build-test` used
`|| echo "test failed"` patterns, making every failure non-fatal. An image
where cargo, python, go, or any tool was missing would still pass CI and
be released.

Changes:
- Add `set -e` to all test steps so any failed command fails the CI job
- Remove all `|| echo "..."` fallback patterns from test commands
- Add comprehensive toolchain tests covering all installed runtimes:
  cargo, rustup (Rust), pip3, python3 (Python via pyenv), gem, ruby
  (Ruby via rbenv), kotlin (JVM via SDKMAN), swift, dotnet, Rscript (R)
- Add post-release smoke tests in `docker-build-push` job that run
  against the actually-published image (not just the locally built one),
  so every main/dispatch release is validated before downstream jobs run
- Add case study docs in `docs/case-studies/issue-62/`
