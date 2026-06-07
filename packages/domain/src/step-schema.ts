export type StepKind =
  | "recorded.click"
  | "keyword.navigate"
  | "keyword.fill"
  | "keyword.assertText";

export type RecordedClickStep = {
  kind: "recorded.click";
  selector: string;
};

export type KeywordNavigateStep = {
  kind: "keyword.navigate";
  url: string;
};

export type KeywordFillStep = {
  kind: "keyword.fill";
  selector: string;
  value: string;
};

export type KeywordAssertTextStep = {
  kind: "keyword.assertText";
  selector: string;
  expected: string;
};

export type Step =
  | RecordedClickStep
  | KeywordNavigateStep
  | KeywordFillStep
  | KeywordAssertTextStep;

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
}

export function parseStep(input: unknown): Step {
  if (!input || typeof input !== "object") {
    throw new Error("Step must be an object.");
  }

  const candidate = input as Record<string, unknown>;
  const kind = candidate.kind;

  if (kind === "recorded.click") {
    return {
      kind,
      selector: requireNonEmptyString(candidate.selector, "Step selector"),
    };
  }

  if (kind === "keyword.navigate") {
    return {
      kind,
      url: requireNonEmptyString(candidate.url, "Step url"),
    };
  }

  if (kind === "keyword.fill") {
    return {
      kind,
      selector: requireNonEmptyString(candidate.selector, "Step selector"),
      value: requireNonEmptyString(candidate.value, "Step value"),
    };
  }

  if (kind === "keyword.assertText") {
    return {
      kind,
      selector: requireNonEmptyString(candidate.selector, "Step selector"),
      expected: requireNonEmptyString(candidate.expected, "Step expected"),
    };
  }

  throw new Error("Unsupported step kind.");
}
