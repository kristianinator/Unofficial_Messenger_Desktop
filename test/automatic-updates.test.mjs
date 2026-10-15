import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  getMacAppBundlePath,
  getSquirrelUpdateExecutablePath,
  hasMacDeveloperIdSignature,
  isAutomaticUpdateEligible,
  UPDATE_REPOSITORY,
} from "../src/automatic-updates.mjs";

test("uses the public repository as the automatic update source", () => {
  assert.equal(
    UPDATE_REPOSITORY,
    "kristianinator/Unofficial_Messenger_Desktop",
  );
});

test("recognizes a Developer ID signed macOS bundle", () => {
  const executable = "/Applications/Messenger.app/Contents/MacOS/Messenger";
  assert.equal(
    getMacAppBundlePath(executable),
    path.resolve("/Applications/Messenger.app"),
  );
  assert.equal(
    hasMacDeveloperIdSignature(executable, () => ({
      status: 0,
      stdout: "",
      stderr: "TeamIdentifier=ABCDE12345\n",
    })),
    true,
  );
  assert.equal(
    hasMacDeveloperIdSignature(executable, () => ({
      status: 0,
      stdout: "",
      stderr: "TeamIdentifier=not set\nSignature=adhoc\n",
    })),
    false,
  );
});

test("finds Update.exe next to a Squirrel app directory", () => {
  const executable = path.join(
    "C:\\Users\\Test\\AppData\\Local\\UnofficialMessengerDesktop",
    "app-1.2.0",
    "Unofficial Messenger Desktop.exe",
  );

  assert.equal(
    getSquirrelUpdateExecutablePath(executable),
    path.resolve(path.dirname(executable), "..", "Update.exe"),
  );
});

test("enables automatic updates only for an installed Windows build", () => {
  const baseOptions = {
    platform: "win32",
    isPackaged: true,
    execPath: "C:\\app-1.2.0\\Messenger.exe",
  };

  assert.equal(
    isAutomaticUpdateEligible({ ...baseOptions, pathExists: () => true }),
    true,
  );
  assert.equal(
    isAutomaticUpdateEligible({ ...baseOptions, pathExists: () => false }),
    false,
  );
  assert.equal(
    isAutomaticUpdateEligible({
      ...baseOptions,
      platform: "darwin",
      macSignatureVerifier: () => true,
    }),
    true,
  );
  assert.equal(
    isAutomaticUpdateEligible({
      ...baseOptions,
      platform: "darwin",
      macSignatureVerifier: () => false,
    }),
    false,
  );
  assert.equal(
    isAutomaticUpdateEligible({
      ...baseOptions,
      isPackaged: false,
      pathExists: () => true,
    }),
    false,
  );
});
