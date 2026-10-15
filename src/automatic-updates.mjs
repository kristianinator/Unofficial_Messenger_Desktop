import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

export const UPDATE_REPOSITORY =
  "kristianinator/Unofficial_Messenger_Desktop";

export function getSquirrelUpdateExecutablePath(execPath) {
  if (typeof execPath !== "string" || execPath.length === 0) return null;

  return path.resolve(path.dirname(execPath), "..", "Update.exe");
}

export function getMacAppBundlePath(execPath) {
  if (typeof execPath !== "string" || execPath.length === 0) return null;

  return path.resolve(path.dirname(execPath), "..", "..");
}

export function hasMacDeveloperIdSignature(
  execPath,
  runCodesign = spawnSync,
) {
  const appBundle = getMacAppBundlePath(execPath);
  if (!appBundle) return false;

  const result = runCodesign(
    "/usr/bin/codesign",
    ["--display", "--verbose=4", appBundle],
    { encoding: "utf8" },
  );
  const signatureDetails = `${result?.stdout ?? ""}\n${result?.stderr ?? ""}`;

  return result?.status === 0
    && /^TeamIdentifier=[A-Z0-9]+$/m.test(signatureDetails);
}

export function isAutomaticUpdateEligible({
  platform = process.platform,
  isPackaged = false,
  execPath = process.execPath,
  pathExists = existsSync,
  macSignatureVerifier = hasMacDeveloperIdSignature,
} = {}) {
  if (!isPackaged) return false;

  if (platform === "darwin") {
    return macSignatureVerifier(execPath);
  }

  if (platform !== "win32") return false;

  const updateExecutable = getSquirrelUpdateExecutablePath(execPath);
  return Boolean(updateExecutable && pathExists(updateExecutable));
}
