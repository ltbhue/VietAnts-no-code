export type StepKind = "recorded.click";

export type RecordedClickStep = {
  kind: "recorded.click";
  selector: string;
};

export type Step = RecordedClickStep;

export function parseStep(input: unknown): Step {
  if (!input || typeof input !== "object") {
    throw new Error("Step must be an object.");
  }

  const candidate = input as Partial<RecordedClickStep>;
  if (candidate.kind !== "recorded.click") {
    throw new Error("Unsupported step kind.");
  }
  if (typeof candidate.selector !== "string") {
    throw new Error("Step selector is required.");
  }
  const selector = candidate.selector.trim();
  if (selector.length === 0) {
    throw new Error("Step selector is required.");
  }

  return {
    kind: candidate.kind,
    selector,
  };
}
