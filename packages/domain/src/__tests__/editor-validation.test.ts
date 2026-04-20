import test from "node:test";
import assert from "node:assert/strict";

import { validateForPublish } from "../editor-validation";

test("fails when loop dataset is missing", () => {
  const result = validateForPublish({
    steps: [{ kind: "control.loop", datasetRef: "" }],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("datasetRef")));
});

test("passes for simple recorded steps only", () => {
  const result = validateForPublish({
    steps: [{ kind: "recorded.click", selector: "[data-test='x']" }],
  });
  assert.equal(result.ok, true);
});

test("fails when control.if has empty condition", () => {
  const result = validateForPublish({
    steps: [{ kind: "control.if", condition: "" }],
  });
  assert.equal(result.ok, false);
});
