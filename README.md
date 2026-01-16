# Unofficial Messenger Desktop (Web Wrapper)

An unofficial desktop wrapper for https://www.messenger.com built with Electron.

## Disclaimer
This project is **not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.**  
“Messenger” and “Facebook” are trademarks of Meta Platforms, Inc.

This application simply loads the publicly available website (messenger.com) in an Electron window.  
It does **not** use private Meta APIs, bypass authentication, or modify Meta services.

## Features
- Runs messenger.com in a desktop window
- Opens external links in your default browser
- Context menu (copy/paste/select all)
- Persistent session (`persist:messenger`)
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
Run in dev mode:
```bash
npm run dev
```

(or `npm start` if you use `start` as dev script)

## Build

### macOS (DMG via Electron Forge)
```bash
npm run make:mac
```

### Windows (NSIS installer via electron-builder)
```bash
npm run make:win
```

## Notes
- This is a web wrapper: all content is loaded directly from https://www.messenger.com
- Login/session data is stored locally by Electron (similar to a browser profile)

## License
MIT License

## Trademarks
“Messenger”, “Facebook”, and related marks are trademarks of Meta Platforms, Inc.
This project is not endorsed by Meta.
