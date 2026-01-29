---
bump: minor
---

Add disk space measurement and README auto-update feature

- Add `scripts/measure-disk-space.sh` to measure disk space used by each component
- Add `scripts/update-readme-sizes.sh` to update README with component sizes table
- Add `.github/workflows/measure-disk-space.yml` workflow to run measurements on push to main
- Update README.md with placeholder for component sizes table
- Each component size is measured after cleanup for accurate results
- Results are stored in `data/disk-space-measurements.json` for transparency
