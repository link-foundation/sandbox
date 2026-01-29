---
bump: patch
---

Fix disk space measurement workflow producing 0MB results

- Remove aggressive apt package cleanup that broke package installation
- Preserve apt package lists during measurement cleanup
- Add validation step to prevent committing invalid measurements (< 1000MB or < 10 components)
- Add case study documentation for root cause analysis (docs/case-studies/issue-29)

Fixes #29
