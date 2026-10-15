# Unofficial Messenger Desktop

A cross-platform unofficial desktop wrapper for Facebook Messages, built with Electron.

## Disclaimer
This project is **not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.**  
“Messenger” and “Facebook” are trademarks of Meta Platforms, Inc.

This application loads the publicly available Facebook Messages website in an Electron window.
It does **not** use private Meta APIs, bypass authentication, or modify Meta services.

## Features
- Runs Facebook Messages in a focused desktop window
- Opens external links in your default browser
- Context menu (copy/paste/select all)
- Persistent session (`persist:messenger`)
- Installers for Windows, macOS, and Linux
- Automatic checks for the latest stable GitHub Release
- Unread indicators:
  - macOS dock badge
  - Windows taskbar flashing + overlay badge icon

## Requirements
- Node.js (LTS recommended)
- npm

## Install
```bash
npm install
```

## Development
Run in development mode:
```bash
npm start
```

Run the automated checks:

```bash
npm run check
```

## Build

Build the distributables for the current operating system:

```bash
npm run make
```

The build output is written to `out/make`.

GitHub Releases publish clearly named downloads for each supported system and processor architecture.

### Windows

Produces a Squirrel installer and a portable ZIP:

```bash
npm run make:win
```

### macOS

Produces a DMG and a ZIP for the current Mac processor architecture. GitHub Releases build and label both Apple silicon (ARM64) and Intel (x64) variants:

```bash
npm run make:mac
```

macOS packages are ad-hoc signed, and CI checks their architecture and signature integrity and starts the packaged application on both Apple silicon and Intel runners. Because the project does not currently use a paid Apple Developer ID, the first launch after downloading may need to be approved from **System Settings → Privacy & Security → Open Anyway**.

If macOS reports that the official GitHub download is damaged and does not show **Open Anyway**, move the app to `/Applications`, then remove only its download quarantine marker and open it:

```bash
xattr -dr com.apple.quarantine "/Applications/Unofficial Messenger Desktop.app"
open "/Applications/Unofficial Messenger Desktop.app"
```

Only use this command with a package downloaded from this repository's official GitHub Releases page. Fully unattended macOS installation and updates require an Apple Developer ID signature and notarization.

The GitHub workflows automatically switch from the ad-hoc fallback to Developer ID signing and Apple notarization when these repository secrets are configured:

- `MACOS_CERTIFICATE`: Base64-encoded Developer ID Application `.p12` file
- `MACOS_CERTIFICATE_PASSWORD`: Password for the `.p12` file
- `MACOS_SIGN_IDENTITY`: Full Developer ID Application identity
- `APPLE_ID`, `APPLE_ID_PASSWORD`, and `APPLE_TEAM_ID`: notarization credentials

Signed builds are verified with Hardened Runtime and `spctl` before publication. The workflow refuses a partially configured signing setup.

### Linux

Produces DEB, RPM, and ZIP packages:

```bash
npm run make:linux
```

Linux packaging requires `fakeroot`, `dpkg`, and `rpm`.

When a new package version reaches `main`, GitHub Actions creates the matching `v*.*.*` tag and GitHub Release, then builds and attaches all supported installers.

The installed Windows build checks for stable updates shortly after startup and every six hours. A new version is downloaded in the background and the app then offers **Restart and install**. Releases include the Squirrel `RELEASES` manifest and full update package required for automatic installation.

Windows portable, ad-hoc macOS, and Linux builds continue to show a download notification instead of modifying files outside a supported installer. Linux users should update through their distribution package manager. A Developer ID signed and notarized macOS build automatically uses the same background download and restart-to-install flow; the application verifies that it has a real Apple Team ID before enabling it.

## Notes
- This is a web wrapper: all message content is loaded directly from Facebook
- Login/session data is stored locally by Electron (similar to a browser profile)

## License
MIT License

## Trademarks
“Messenger”, “Facebook”, and related marks are trademarks of Meta Platforms, Inc.
This project is not endorsed by Meta.

## ❤️ Support / Donations
If you like this project and want to support development:

- GitHub Sponsors: https://github.com/sponsors/kristianinator
- PayPal: https://www.paypal.me/Wirtty
- Revolut: @kristipmlt https://revolut.me/kristiplmt

Thank you! 🙏
