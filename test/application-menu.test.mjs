import assert from "node:assert/strict";
import test from "node:test";

import { createApplicationMenuTemplate } from "../src/application-menu.mjs";

function createTemplate(platform) {
  const noop = () => {};
  return createApplicationMenuTemplate({
    platform,
    productName: "Unofficial Messenger Desktop",
    checkForUpdates: noop,
    openReleaseNotes: noop,
    openRepository: noop,
    reportProblem: noop,
    showAbout: noop,
  });
}

function findMenu(template, label) {
  return template.find((item) => item.label === label);
}

test("uses the standard Windows and Linux application menu sections", () => {
  for (const platform of ["win32", "linux"]) {
    const template = createTemplate(platform);

    assert.deepEqual(
      template.map((item) => item.label),
      ["File", "Edit", "View", "Window", "Help"],
    );
    assert.equal(
      findMenu(template, "Help").submenu.some(
        (item) => item.label === "About Unofficial Messenger Desktop",
      ),
      true,
    );
    assert.equal(
      findMenu(template, "Help").submenu.some(
        (item) => item.label === "Check for Updates...",
      ),
      true,
    );
  }
});

test("uses the conventional macOS application menu", () => {
  const template = createTemplate("darwin");
  const appMenu = template[0];

  assert.equal(appMenu.label, "Unofficial Messenger Desktop");
  assert.equal(appMenu.submenu[0].label, "About Unofficial Messenger Desktop");
  assert.equal(appMenu.submenu[1].label, "Check for Updates...");
  assert.equal(appMenu.submenu.at(-1).role, "quit");
  assert.deepEqual(
    template.slice(1).map((item) => item.label),
    ["File", "Edit", "View", "Window", "Help"],
  );
});

test("connects help actions to their callbacks", () => {
  const calls = [];
  const template = createApplicationMenuTemplate({
    platform: "win32",
    productName: "Unofficial Messenger Desktop",
    checkForUpdates: () => calls.push("updates"),
    openReleaseNotes: () => calls.push("notes"),
    openRepository: () => calls.push("repository"),
    reportProblem: () => calls.push("problem"),
    showAbout: () => calls.push("about"),
  });
  const helpItems = findMenu(template, "Help").submenu;

  for (const item of helpItems) item.click?.();

  assert.deepEqual(calls, [
    "updates",
    "notes",
    "repository",
    "problem",
    "about",
  ]);
});
