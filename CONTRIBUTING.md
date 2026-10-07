# Contributing

Thanks for considering contributing! ❤️

## How to contribute
You can contribute in many ways:
- Bug reports / feature requests
- Code improvements and refactoring
- UI/UX improvements
- Documentation updates
- Testing on different platforms (Windows/macOS/Linux)

## Before you start
- Please search existing issues and pull requests first.
- Keep pull requests focused (one improvement per PR is best).
- If you plan a large change, open an issue/discussion first.

## Development setup

### Requirements
- Node.js (LTS recommended)
- npm

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm start
```

### Run checks
```bash
npm run check
```

### Build distributables for your platform
```bash
npm run make
```

## Code style
- Keep changes minimal and readable
- Prefer small functions
- Avoid adding heavy dependencies unless necessary
- Security first (Electron wrappers can be risky if misconfigured)

## Pull request process
1. Fork the repository
2. Create a new branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit with clear messages
4. Push to your fork
5. Open a Pull Request

## Release process

Before creating a release, update the version in `package.json` and `package-lock.json` and add a matching `## [x.y.z]` section to `CHANGELOG.md`. When that version change reaches `main`, the release workflow creates the `vx.y.z` tag, extracts that version's notes, creates the GitHub Release, and builds and uploads the installers for every supported platform.

## Reporting issues
When opening an issue, please include:
- OS (Windows/macOS/Linux + version)
- Node.js version
- App version
- Steps to reproduce
- Expected behavior vs actual behavior

## Contributor License
By contributing, you agree that your contributions may be distributed under the same license as this project (MIT).
