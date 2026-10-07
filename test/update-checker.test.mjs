import assert from "node:assert/strict";
import test from "node:test";

import {
  compareVersions,
  fetchLatestRelease,
  findAvailableUpdate,
  getReleasePageUrl,
  isNewerVersion
} from "../src/update-checker.mjs";

test("compares stable semantic versions", () => {
  assert.equal(compareVersions("v1.2.0", "1.1.9"), 1);
  assert.equal(compareVersions("1.2.0", "1.2.0"), 0);
  assert.equal(compareVersions("1.1.9", "1.2.0"), -1);
  assert.equal(isNewerVersion("2.0.0", "1.99.99"), true);
});

test("handles prerelease versions and invalid tags safely", () => {
  assert.equal(compareVersions("1.2.0-beta.2", "1.2.0-beta.1"), 1);
  assert.equal(compareVersions("1.2.0", "1.2.0-rc.1"), 1);
  assert.equal(compareVersions("latest", "1.2.0"), null);
  assert.equal(isNewerVersion("latest", "1.2.0"), false);
});

test("reads the latest stable GitHub release", async () => {
  const requested = [];
  const release = await fetchLatestRelease({
    fetchImpl: async (url, options) => {
      requested.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          draft: false,
          name: "Version 1.2.0",
          prerelease: false,
          published_at: "2026-10-07T10:00:00Z",
          tag_name: "v1.2.0"
        })
      };
    }
  });

  assert.equal(requested.length, 1);
  assert.match(requested[0].url, /releases\/latest$/);
  assert.equal(
    requested[0].options.headers.Accept,
    "application/vnd.github+json"
  );
  assert.deepEqual(release, {
    name: "Version 1.2.0",
    publishedAt: "2026-10-07T10:00:00Z",
    tag: "v1.2.0",
    url: getReleasePageUrl(),
    version: "1.2.0"
  });
});

test("returns an update only when the release is newer", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      draft: false,
      prerelease: false,
      tag_name: "v1.2.0"
    })
  });

  assert.equal(
    (await findAvailableUpdate("1.1.0", { fetchImpl })).version,
    "1.2.0"
  );
  assert.equal(await findAvailableUpdate("1.2.0", { fetchImpl }), null);
  assert.equal(await findAvailableUpdate("2.0.0", { fetchImpl }), null);
});

test("treats a missing release as no available update", async () => {
  const release = await fetchLatestRelease({
    fetchImpl: async () => ({ ok: false, status: 404 })
  });

  assert.equal(release, null);
});
