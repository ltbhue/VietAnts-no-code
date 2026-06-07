import test from "node:test";
import assert from "node:assert/strict";

import { canTransition, LifecycleState } from "../lifecycle";
import { can, Permission, Role } from "../permissions";
import { parseStep } from "../step-schema";

test("parseStep accepts recorded click step kind", () => {
  const parsed = parseStep({
    kind: "recorded.click",
    selector: "#submit",
  });

  assert.equal(parsed.kind, "recorded.click");
  assert.equal(parsed.selector, "#submit");
});

test("parseStep trims selector and returns normalized value", () => {
  const parsed = parseStep({
    kind: "recorded.click",
    selector: "   #save-btn   ",
  });

  assert.equal(parsed.selector, "#save-btn");
});

test("parseStep throws for invalid kind", () => {
  assert.throws(() => {
    parseStep({
      kind: "recorded.input",
      selector: "#field",
    });
  }, /Unsupported step kind/);
});

test("parseStep throws for missing selector", () => {
  assert.throws(() => {
    parseStep({
      kind: "recorded.click",
    });
  }, /Step selector is required/);
});

test("parseStep throws for whitespace-only selector", () => {
  assert.throws(() => {
    parseStep({
      kind: "recorded.click",
      selector: "   ",
    });
  }, /Step selector is required/);
});

test("parseStep accepts keyword.navigate step kind", () => {
  const parsed = parseStep({
    kind: "keyword.navigate",
    url: "https://example.com/login",
  });

  assert.equal(parsed.kind, "keyword.navigate");
  if (parsed.kind === "keyword.navigate") {
    assert.equal(parsed.url, "https://example.com/login");
  }
});

test("parseStep accepts keyword.fill step kind", () => {
  const parsed = parseStep({
    kind: "keyword.fill",
    selector: "input[name='email']",
    value: "tester@vietants.com",
  });

  assert.equal(parsed.kind, "keyword.fill");
  if (parsed.kind === "keyword.fill") {
    assert.equal(parsed.selector, "input[name='email']");
    assert.equal(parsed.value, "tester@vietants.com");
  }
});

test("parseStep accepts keyword.assertText step kind", () => {
  const parsed = parseStep({
    kind: "keyword.assertText",
    selector: "body",
    expected: "Dashboard",
  });

  assert.equal(parsed.kind, "keyword.assertText");
  if (parsed.kind === "keyword.assertText") {
    assert.equal(parsed.selector, "body");
    assert.equal(parsed.expected, "Dashboard");
  }
});

test("canTransition blocks Draft->Published direct, allows Draft->Validated", () => {
  assert.equal(
    canTransition(LifecycleState.Draft, LifecycleState.Published),
    false,
  );
  assert.equal(
    canTransition(LifecycleState.Draft, LifecycleState.Validated),
    true,
  );
});

test("canTransition rejects invalid reverse and self transitions", () => {
  assert.equal(
    canTransition(LifecycleState.Validated, LifecycleState.Draft),
    false,
  );
  assert.equal(
    canTransition(LifecycleState.Published, LifecycleState.Published),
    false,
  );
});

test("can(role, permission) covers allowed and denied paths per role", () => {
  assert.equal(can(Role.Admin, Permission.TestsUpdate), true);
  assert.equal(can(Role.Admin, Permission.ResultsView), true);
  assert.equal(can(Role.Admin, Permission.WorkspaceArchive), false);

  assert.equal(can(Role.Editor, Permission.TestsUpdate), true);
  assert.equal(can(Role.Editor, Permission.ResultsView), true);
  assert.equal(can(Role.Editor, Permission.WorkspaceArchive), false);

  assert.equal(can(Role.Viewer, Permission.ResultsView), true);
  assert.equal(can(Role.Viewer, Permission.TestsUpdate), false);
  assert.equal(can(Role.Viewer, Permission.WorkspaceArchive), false);
});
