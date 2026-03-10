---
bump: minor
---

feat: preinstall Playwright and Puppeteer system dependencies and CLI tools (issue #68)

Add all OS-level library dependencies required by Chromium, Firefox, and WebKit browsers to the `sandbox-js` base image and `essentials-sandbox`. This eliminates the "Host system is missing dependencies to run browsers" warning when using Playwright or Puppeteer.

Also install `playwright` and `@puppeteer/browsers` CLIs globally in the essentials sandbox so they are available in all derived images.
