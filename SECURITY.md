# Security Policy

## Supported Versions
This project is community maintained. Only the latest version on the `main` branch is supported.

## Reporting a Vulnerability
If you discover a security issue, please **do not** open a public GitHub Issue.

Instead, report it privately to the maintainer with:
- a clear description of the issue
- steps to reproduce
- potential impact (if known)

The maintainer will respond as soon as possible and coordinate a fix and release.

## Scope
This application is a desktop wrapper for https://www.messenger.com and does not provide its own backend.
Security issues may still exist, such as:
- unexpected navigation / external link handling
- preload / IPC exposure
- Electron configuration issues (sandboxing, contextIsolation, etc.)
