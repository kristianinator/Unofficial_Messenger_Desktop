import {
  isSafeExternalUrl,
  isTrustedNavigationUrl
} from "./security.mjs";
import { createBadgePng } from "./badge-icon.mjs";
import { createContextMenuTemplate } from "./context-menu.mjs";
import { findAvailableUpdate } from "./update-checker.mjs";
import squirrelStartup from "electron-squirrel-startup";

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  net,
  shell
} = require("electron");
const path = require("path");

const UPDATE_CHECK_DELAY_MS = 15 * 1000;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const UPDATE_CHECK_TIMEOUT_MS = 10 * 1000;

if (squirrelStartup) {
  app.quit();
}

let win = null;
let lastUnread = -1;
let updateCheckInFlight = null;
let updateCheckTimeout = null;
let updateCheckInterval = null;
let lastPromptedUpdate = null;

// Enable platform notifications
app.commandLine.appendSwitch("enable-features", "PlatformNotifications");

// ----------------------------
// macOS dock badge
// ----------------------------
function setDockBadge(countStr) {
  if (process.platform !== "darwin") return;

  const n = Number(countStr) || 0;
  app.dock.setBadge(n > 0 ? String(n) : "");
}

// ----------------------------
// Windows: generate overlay badge icon
// ----------------------------
function createBadgeIcon(count) {
  if (process.platform !== "win32") return null;

  return nativeImage.createFromBuffer(createBadgePng(count));
}

// ----------------------------
// Windows: flash + overlay icon
// ----------------------------
function setWindowsTaskbarBadge(countStr, force = false) {
  if (process.platform !== "win32") return;
  if (!win || win.isDestroyed()) return;

  const n = Number(countStr) || 0;

  // avoid re-setting same value constantly (prevents Windows ignoring it)
  if (!force && n === lastUnread) return;
  lastUnread = n;

  // ✅ flash taskbar (your behavior)
  win.flashFrame(n > 0);

  // ✅ overlay badge
  try {
    if (n <= 0) {
      win.setOverlayIcon(null, "");
    } else {
      const badge = createBadgeIcon(n);
      win.setOverlayIcon(badge, `${n} unread messages`);
    }
  } catch (err) {
    console.error("Failed to set overlay icon:", err);
  }
}

function openExternalSafely(url) {
  if (!isSafeExternalUrl(url)) return;

  shell.openExternal(url).catch((error) => {
    console.error("Failed to open external URL:", error);
  });
}

async function checkForUpdates() {
  if (updateCheckInFlight) return updateCheckInFlight;

  updateCheckInFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      UPDATE_CHECK_TIMEOUT_MS
    );

    try {
      const release = await findAvailableUpdate(app.getVersion(), {
        fetchImpl: net.fetch,
        signal: controller.signal
      });

      if (!release || release.version === lastPromptedUpdate) return;

      lastPromptedUpdate = release.version;

      const options = {
        type: "info",
        buttons: ["Open Downloads", "Later"],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
        title: "Update available",
        message: `Unofficial Messenger Desktop ${release.version} is available`,
        detail: `You are using version ${app.getVersion()}. Open the GitHub release page to download the update for your operating system.`
      };
      const parentWindow = win && !win.isDestroyed() ? win : null;
      const result = parentWindow
        ? await dialog.showMessageBox(parentWindow, options)
        : await dialog.showMessageBox(options);

      if (result.response === 0) openExternalSafely(release.url);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.warn("Update check failed:", error);
      }
    } finally {
      clearTimeout(timeout);
    }
  })();

  try {
    await updateCheckInFlight;
  } finally {
    updateCheckInFlight = null;
  }
}

function scheduleUpdateChecks() {
  if (!app.isPackaged && process.env.MESSENGER_UPDATE_CHECK !== "1") return;

  updateCheckTimeout = setTimeout(() => {
    void checkForUpdates();
  }, UPDATE_CHECK_DELAY_MS);

  updateCheckInterval = setInterval(() => {
    void checkForUpdates();
  }, UPDATE_CHECK_INTERVAL_MS);
}

function stopUpdateChecks() {
  if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
  if (updateCheckInterval) clearInterval(updateCheckInterval);

  updateCheckTimeout = null;
  updateCheckInterval = null;
}

function handleNavigation(event, url) {
  if (isTrustedNavigationUrl(url)) return;

  event.preventDefault();
  openExternalSafely(url);
}

function getWindowIconPath() {
  const iconName = process.platform === "win32" ? "icon.ico" : "icon.png";
  const assetsPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.resolve(__dirname, "../../assets");

  return path.join(assetsPath, iconName);
}

async function installMessengerLayoutFix(webContents) {
  await webContents.executeJavaScript(`
    (() => {
      const applyLayoutFix = () => {
        for (const root of [document.documentElement, document.body]) {
          if (root && getComputedStyle(root).overflowY !== "hidden") {
            root.style.setProperty("overflow-y", "hidden", "important");
          }
        }

        const threadList = document.querySelector(
          '[role="navigation"][aria-label="Thread list"]'
        );
        const main = document.querySelector('[role="main"]');

        if (!threadList || !main) return;

        let commonContainer = threadList;
        while (commonContainer && !commonContainer.contains(main)) {
          commonContainer = commonContainer.parentElement;
        }

        if (!commonContainer) return;

        let shiftedContainer = null;

        if (commonContainer.getBoundingClientRect().top > 0.5) {
          let candidate = commonContainer;

          while (candidate.parentElement) {
            const rect = candidate.getBoundingClientRect();
            const parentRect = candidate.parentElement.getBoundingClientRect();

            if (rect.top > 0.5 && parentRect.top <= 0.5) {
              shiftedContainer = candidate;
              break;
            }

            candidate = candidate.parentElement;
          }
        }

        if (shiftedContainer) {
          shiftedContainer.style.setProperty("top", "0px", "important");
          shiftedContainer.style.setProperty("transform", "none", "important");
        }

        const fullHeightElements = new Set([
          threadList,
          main,
          commonContainer,
          shiftedContainer,
          shiftedContainer?.parentElement
        ]);

        for (const element of fullHeightElements) {
          if (!element) continue;
          element.style.setProperty("height", "100vh", "important");
          element.style.setProperty("max-height", "100vh", "important");
        }

        let pageContainer = main.parentElement;
        while (pageContainer && pageContainer !== document.body) {
          pageContainer.style.setProperty(
            "overflow-y",
            "hidden",
            "important"
          );

          pageContainer = pageContainer.parentElement;
        }

        const messageLog = main.querySelector('[role="log"]');
        if (messageLog) {
          const mainRect = main.getBoundingClientRect();
          let conversationElement = messageLog.parentElement;

          while (conversationElement && conversationElement !== main) {
            const rect = conversationElement.getBoundingClientRect();
            const topInset = Math.max(0, rect.top - mainRect.top);
            const bottomInset = Math.max(0, mainRect.bottom - rect.bottom);
            const spansConversationWidth = rect.width >= mainRect.width * 0.8;

            if (
              spansConversationWidth &&
              topInset <= 32 &&
              bottomInset > topInset + 4
            ) {
              const verticalInsets = Math.round(topInset * 2);
              const conversationHeight =
                "calc(100vh - " + verticalInsets + "px)";

              conversationElement.style.setProperty(
                "height",
                conversationHeight,
                "important"
              );
              conversationElement.style.setProperty(
                "max-height",
                conversationHeight,
                "important"
              );
            }

            conversationElement = conversationElement.parentElement;
          }
        }
      };

      if (!globalThis.__unofficialMessengerLayoutObserver) {
        globalThis.__unofficialMessengerLayoutObserver = new MutationObserver(
          applyLayoutFix
        );
        globalThis.__unofficialMessengerLayoutObserver.observe(
          document.documentElement,
          { childList: true, subtree: true }
        );
        window.addEventListener("resize", applyLayoutFix);
      }

      if (!globalThis.__unofficialMessengerRootOverflowObserver) {
        globalThis.__unofficialMessengerRootOverflowObserver =
          new MutationObserver(applyLayoutFix);
        globalThis.__unofficialMessengerRootOverflowObserver.observe(
          document.documentElement,
          { attributes: true, attributeFilter: ["class", "style"] }
        );

        if (document.body) {
          globalThis.__unofficialMessengerRootOverflowObserver.observe(
            document.body,
            { attributes: true, attributeFilter: ["class", "style"] }
          );
        }
      }

      applyLayoutFix();
    })()
  `);
}

// ----------------------------
// Create window
// ----------------------------
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // ✅ show only when ready
    icon: getWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: "persist:messenger"
    }
  });

  win.setMenuBarVisibility(false);

  win.once("ready-to-show", () => {
    win.show();

    // ensure overlay icon is applied after window exists on taskbar
    if (process.platform === "win32" && lastUnread > 0) {
      setTimeout(() => setWindowsTaskbarBadge(String(lastUnread), true), 250);
    }
  });

  win.loadURL("https://www.facebook.com/messages").catch((error) => {
    console.error("Failed to load Facebook Messages:", error);
  });

  // ✅ open popup windows in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: "deny" };
  });

  // ✅ open external navigation in default browser
  win.webContents.on("will-navigate", handleNavigation);
  win.webContents.on("will-redirect", handleNavigation);

  win.webContents.on("did-finish-load", async () => {
    try {
      await win.webContents.insertCSS(`
        html,
        body {
          overflow: hidden !important;
        }

        div[role="banner"],
        div[aria-label="Facebook"][role="navigation"] {
          display: none !important;
        }
      `);

      await installMessengerLayoutFix(win.webContents);

    } catch (error) {
      console.error("Failed to apply Messenger-specific CSS:", error);
    }
  });

  // ✅ Right click context menu
  win.webContents.on("context-menu", (event, params) => {
    const menu = Menu.buildFromTemplate(
      createContextMenuTemplate(params, () => {
        win.webContents.copyImageAt(params.x, params.y);
      })
    );

    menu.popup({ window: win });
  });

  win.on("closed", () => {
    win = null;
  });
}

// ----------------------------
// IPC: unread count updates
// ----------------------------
ipcMain.on("unread-count", (event, countStr) => {
  if (!win || event.sender !== win.webContents) return;

  setDockBadge(countStr);            // macOS badge
  setWindowsTaskbarBadge(countStr);  // Windows badge + flash
});

// ----------------------------
// App lifecycle
// ----------------------------
app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("kspasov.messenger");
  }

  createWindow();
  scheduleUpdateChecks();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", stopUpdateChecks);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
