import assert from "node:assert/strict";
import test from "node:test";

import { createBadgePng } from "../src/badge-icon.mjs";

test("creates a valid 32x32 RGBA PNG badge", () => {
  const badge = createBadgePng(7);

  assert.deepEqual(
    badge.subarray(0, 8),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  assert.equal(badge.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(badge.readUInt32BE(16), 32);
  assert.equal(badge.readUInt32BE(20), 32);
  assert.equal(badge.subarray(-8, -4).toString("ascii"), "IEND");
});

test("renders different counts and caps large counts at 99+", () => {
  assert.notDeepEqual(createBadgePng(1), createBadgePng(42));
  assert.deepEqual(createBadgePng(100), createBadgePng(999));
});
