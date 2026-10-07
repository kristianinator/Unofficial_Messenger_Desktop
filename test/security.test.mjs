import test from "node:test";
import assert from "node:assert/strict";
import {
  isSafeExternalUrl,
  isTrustedNavigationUrl
} from "../src/security.mjs";

test("allows Facebook and Messenger HTTPS navigation", () => {
  assert.equal(isTrustedNavigationUrl("https://www.facebook.com/messages"), true);
  assert.equal(isTrustedNavigationUrl("https://m.facebook.com/messages"), true);
  assert.equal(isTrustedNavigationUrl("https://messenger.com/"), true);
});

test("rejects lookalike hosts and unsafe protocols", () => {
  assert.equal(
    isTrustedNavigationUrl("https://www.facebook.com.evil.example/messages"),
    false
  );
  assert.equal(isTrustedNavigationUrl("http://facebook.com/messages"), false);
  assert.equal(isTrustedNavigationUrl("javascript:alert(1)"), false);
  assert.equal(isTrustedNavigationUrl("not a URL"), false);
});

test("only permits expected external protocols", () => {
  assert.equal(isSafeExternalUrl("https://example.com"), true);
  assert.equal(isSafeExternalUrl("http://example.com"), true);
  assert.equal(isSafeExternalUrl("mailto:support@example.com"), true);
  assert.equal(isSafeExternalUrl("file:///C:/Windows/System32/calc.exe"), false);
  assert.equal(isSafeExternalUrl("custom-protocol://example"), false);
});
