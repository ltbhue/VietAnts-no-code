export type ActionType = "navigate" | "click" | "fill" | "assertText";

export type DraftAction = {
  type: ActionType;
  selector?: string;
  value?: string;
  expected?: string;
};

function normalizeQuoted(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parsePlaywrightScriptToActions(source: string): DraftAction[] {
  const actions: DraftAction[] = [];
  const lines = source.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const gotoMatch = line.match(/page\.goto\((.+?)\)/);
    if (gotoMatch) {
      const url = normalizeQuoted(gotoMatch[1]);
      if (url) actions.push({ type: "navigate", selector: url });
      continue;
    }

    const clickMatch = line.match(/(?:page|locator)\.getBy\w+\((.+?)\)\.click\(/);
    if (clickMatch) {
      const selector = normalizeQuoted(clickMatch[1]);
      if (selector) actions.push({ type: "click", selector });
      continue;
    }
    const locatorClickMatch = line.match(/page\.locator\((.+?)\)\.click\(/);
    if (locatorClickMatch) {
      const selector = normalizeQuoted(locatorClickMatch[1]);
      if (selector) actions.push({ type: "click", selector });
      continue;
    }

    const fillMatch = line.match(/page\.locator\((.+?)\)\.fill\((.+?)\)/);
    if (fillMatch) {
      const selector = normalizeQuoted(fillMatch[1]);
      const value = normalizeQuoted(fillMatch[2]);
      if (selector) actions.push({ type: "fill", selector, value });
      continue;
    }
    const roleFillMatch = line.match(/(?:page|locator)\.getBy\w+\((.+?)\)\.fill\((.+?)\)/);
    if (roleFillMatch) {
      const selector = normalizeQuoted(roleFillMatch[1]);
      const value = normalizeQuoted(roleFillMatch[2]);
      if (selector) actions.push({ type: "fill", selector, value });
      continue;
    }

    const assertMatch = line.match(/expect\(.+?\)\.(?:toContainText|toHaveText)\((.+?)\)/);
    if (assertMatch) {
      const expected = normalizeQuoted(assertMatch[1]);
      if (expected) actions.push({ type: "assertText", selector: "body", expected });
      continue;
    }
  }
  return actions;
}

export function toRecordedStep(action: DraftAction): Record<string, unknown> | null {
  if (action.type === "navigate") return null;
  if (!action.selector?.trim()) return null;
  if (action.type === "click") {
    return { kind: "recorded.click", selector: action.selector.trim() };
  }
  if (action.type === "fill") {
    return {
      kind: "keyword.fill",
      selector: action.selector.trim(),
      value: action.value?.trim() ?? "",
    };
  }
  if (action.type === "assertText") {
    return {
      kind: "keyword.assertText",
      selector: action.selector.trim(),
      expected: action.expected?.trim() ?? "",
    };
  }
  return null;
}

export function stepsToDraftState(steps: unknown[]): { url: string; actions: DraftAction[] } {
  let url = "https://example.com";
  const actions: DraftAction[] = [];

  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const s = step as Record<string, unknown>;

    if (s.kind === "keyword.navigate") {
      const nextUrl = typeof s.url === "string" ? s.url.trim() : "";
      if (nextUrl) url = nextUrl;
      continue;
    }
    if (s.kind === "recorded.click") {
      actions.push({ type: "click", selector: String(s.selector ?? "") });
      continue;
    }
    if (s.kind === "keyword.fill") {
      actions.push({
        type: "fill",
        selector: String(s.selector ?? ""),
        value: String(s.value ?? ""),
      });
      continue;
    }
    if (s.kind === "keyword.assertText") {
      actions.push({
        type: "assertText",
        selector: String(s.selector ?? "body"),
        expected: String(s.expected ?? ""),
      });
    }
  }

  return { url, actions };
}

export function buildDraftSteps(url: string, actions: DraftAction[]): Record<string, unknown>[] {
  return [{ kind: "keyword.navigate", url: url.trim() }, ...actions.map(toRecordedStep).filter(Boolean)];
}
