import assert from "node:assert/strict";
import test from "node:test";

import { createContextMenuTemplate } from "../src/context-menu.mjs";

const editFlags = {
  canCopy: false,
  canCut: false,
  canPaste: false
};

test("adds a working Copy Image action for image contents", () => {
  let copied = false;
  const template = createContextMenuTemplate(
    { editFlags, hasImageContents: true, mediaType: "image" },
    () => {
      copied = true;
    }
  );

  assert.equal(template[0].label, "Copy Image");
  template[0].click();
  assert.equal(copied, true);
  assert.deepEqual(template[1], { type: "separator" });
});

test("does not offer Copy Image for non-image contents", () => {
  const template = createContextMenuTemplate(
    { editFlags, hasImageContents: false, mediaType: "none" },
    () => assert.fail("copyImage should not be called")
  );

  assert.equal(template.some((item) => item.label === "Copy Image"), false);
  assert.equal(template[0].role, "cut");
});
