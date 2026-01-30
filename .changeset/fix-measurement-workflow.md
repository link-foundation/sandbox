---
bump: patch
---

Fix component sizes not being calculated or pushed to README.md on push to main

- Add measurement scripts to workflow path triggers so fixes re-trigger the workflow
- Replace fragile sed-based JSON manipulation with Python for robustness
- Add pipefail to detect script failures in measurement pipeline
