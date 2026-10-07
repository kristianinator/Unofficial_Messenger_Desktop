# Changelog

All notable changes to Unofficial Messenger Desktop are documented here.

## [1.1.0] - 2026-10-07

### Highlights

- Added automatic checks for the latest stable GitHub Release. Packaged builds check shortly after startup and every six hours, then offer to open the official downloads page when a newer version is available.
- Added a **Copy Image** action to the context menu for images displayed in Messenger.
- Removed Facebook's top navigation from the Messenger window and corrected the conversation layout so both the chat list and active conversation use the full available height without an unnecessary page scrollbar.

### Cross-platform distribution

- Added maintained packaging targets for Windows, macOS, and Linux:
  - Windows: Squirrel installer and portable ZIP.
  - macOS: DMG and ZIP for Intel and Apple silicon.
  - Linux: DEB, RPM, and ZIP.
- Added GitHub Actions workflows that test and build all supported platforms and attach installers to versioned GitHub Releases.
- Corrected application icons and resource paths for packaged builds on every supported operating system.

### Security and reliability

- Enabled Electron sandboxing, context isolation, ASAR integrity validation, cookie encryption, and restricted Electron runtime fuses.
- Restricted in-app navigation to trusted Facebook and Messenger HTTPS pages; external links now open safely in the system browser.
- Added guarded IPC handling so unread-count updates are accepted only from the Messenger window.
- Added timeouts and silent offline handling to update checks so GitHub availability never blocks Messenger startup.
- Preserved the existing unread indicators: macOS dock badges and Windows taskbar flashing with an overlay count.

### Maintenance

- Added automated tests for navigation security, image-copy context menus, semantic version comparison, and GitHub release checks.
- Normalized the dependency lockfile for consistent installs across Windows and Linux CI runners.
- Replaced the native canvas badge dependency with a portable JavaScript PNG generator, removing platform-specific compiler and graphics-library requirements.
- Added consistent development, validation, packaging, and release commands and refreshed the project documentation.
