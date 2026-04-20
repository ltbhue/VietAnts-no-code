/**
 * Validates no-code flow content before publishing (advanced steps: loop, branch, etc.).
 */
export type FlowContent = {
  steps?: unknown[];
  lifecycle?: string;
  platform?: string;
};

export function validateForPublish(content: FlowContent): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.steps || !Array.isArray(content.steps)) {
    errors.push("steps must be a non-empty array");
    return { ok: false, errors };
  }

  for (let i = 0; i < content.steps.length; i++) {
    const s = content.steps[i];
    if (!s || typeof s !== "object") {
      errors.push(`steps[${i}] must be an object`);
      continue;
    }
    const step = s as Record<string, unknown>;
    const kind = step.kind;

    if (kind === "control.loop") {
      const ref = step.datasetRef;
      if (typeof ref !== "string" || ref.trim().length === 0) {
        errors.push("datasetRef is required for control.loop");
      }
    }

    if (kind === "control.if") {
      const cond = step.condition;
      if (typeof cond !== "string" || cond.trim().length === 0) {
        errors.push("condition is required for control.if");
      }
    }

    if (kind === "component.call") {
      const id = step.componentId;
      if (typeof id !== "string" || id.trim().length === 0) {
        errors.push("componentId is required for component.call");
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
