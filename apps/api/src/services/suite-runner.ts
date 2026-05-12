import type { PrismaClient } from "../generated/prisma/client";
import fs from "node:fs";
import { chromium } from "playwright";

const SUITE_STEP_TIMEOUT_MS = 3000;
const FAST_RESOURCE_TYPES = new Set(["image", "font", "media"]);

type SuiteLocatorCache = {
  click: Map<string, "roleButton" | "buttonText" | "submitValue" | "text" | "submitFallback">;
  fill: Map<string, "label" | "placeholder" | "placeholderInput" | "passwordInput">;
};

function isLikelyPlainLabel(selector: string): boolean {
  if (!selector) return false;
  if (/[.#:[\]>+~=()'"`]/.test(selector)) return false;
  if (selector.includes("=")) return false;
  return true;
}

function buildFillSelectorCandidates(selector: string): string[] {
  const raw = selector.trim();
  if (!raw) return [];
  const normalized = raw
    .replace(/^(nhập|điền|enter)\s+/i, "")
    .replace(/\s+(đi|vào)$/i, "")
    .trim();
  return normalized && normalized.toLowerCase() !== raw.toLowerCase() ? [raw, normalized] : [raw];
}

function escapeCssAttrValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function tryClickBySemanticLocator(
  page: import("playwright").Page,
  selector: string,
  cache?: SuiteLocatorCache["click"],
): Promise<boolean> {
  const cachedStrategy = cache?.get(selector);
  if (cachedStrategy && (await tryClickWithStrategy(page, selector, cachedStrategy))) {
    return true;
  }

  const contexts: Array<import("playwright").Page | import("playwright").Frame> = [page, ...page.frames()];
  for (const ctx of contexts) {
    try {
      await ctx.getByRole("button", { name: selector, exact: false }).first().click({ timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "roleButton");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx
        .locator(`button:has-text("${escapeCssAttrValue(selector)}")`)
        .first()
        .click({ timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "buttonText");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx
        .locator(`input[type="submit"][value="${escapeCssAttrValue(selector)}"]:visible`)
        .first()
        .click({ timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "submitValue");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx.locator(`text=${selector}`).first().click({ timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "text");
      return true;
    } catch {
      // continue
    }

    if (/đăng nhập|dang nhap|login|sign in/i.test(selector)) {
      try {
        await ctx
          .locator("button[type='submit']:visible, input[type='submit']:visible")
          .first()
          .click({ timeout: SUITE_STEP_TIMEOUT_MS });
        cache?.set(selector, "submitFallback");
        return true;
      } catch {
        // continue
      }
    }
  }
  return false;
}

async function tryFillBySemanticLocator(
  page: import("playwright").Page,
  selector: string,
  value: string,
  cache?: SuiteLocatorCache["fill"],
): Promise<boolean> {
  const cachedStrategy = cache?.get(selector);
  if (cachedStrategy && (await tryFillWithStrategy(page, selector, value, cachedStrategy))) {
    return true;
  }

  const candidates = buildFillSelectorCandidates(selector);
  for (const candidate of candidates) {
    try {
      await page.getByLabel(candidate, { exact: false }).first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "label");
      return true;
    } catch {
      // continue
    }
    try {
      await page.getByPlaceholder(candidate, { exact: false }).first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "placeholder");
      return true;
    } catch {
      // continue
    }
    const escaped = escapeCssAttrValue(candidate);
    try {
      await page
        .locator(`input[placeholder="${escaped}"]:visible`)
        .first()
        .fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "placeholderInput");
      return true;
    } catch {
      // continue
    }
  }

  if (candidates.some((s) => /mật khẩu|password/i.test(s))) {
    try {
      await page.locator("input[type='password']:visible").first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      cache?.set(selector, "passwordInput");
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

async function tryClickWithStrategy(
  page: import("playwright").Page,
  selector: string,
  strategy: "roleButton" | "buttonText" | "submitValue" | "text" | "submitFallback",
): Promise<boolean> {
  const contexts: Array<import("playwright").Page | import("playwright").Frame> = [page, ...page.frames()];
  for (const ctx of contexts) {
    try {
      if (strategy === "roleButton") {
        await ctx.getByRole("button", { name: selector, exact: false }).first().click({ timeout: SUITE_STEP_TIMEOUT_MS });
      } else if (strategy === "buttonText") {
        await ctx.locator(`button:has-text("${escapeCssAttrValue(selector)}")`).first().click({ timeout: SUITE_STEP_TIMEOUT_MS });
      } else if (strategy === "submitValue") {
        await ctx
          .locator(`input[type="submit"][value="${escapeCssAttrValue(selector)}"]:visible`)
          .first()
          .click({ timeout: SUITE_STEP_TIMEOUT_MS });
      } else if (strategy === "text") {
        await ctx.locator(`text=${selector}`).first().click({ timeout: SUITE_STEP_TIMEOUT_MS });
      } else {
        await ctx
          .locator("button[type='submit']:visible, input[type='submit']:visible")
          .first()
          .click({ timeout: SUITE_STEP_TIMEOUT_MS });
      }
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

async function tryFillWithStrategy(
  page: import("playwright").Page,
  selector: string,
  value: string,
  strategy: "label" | "placeholder" | "placeholderInput" | "passwordInput",
): Promise<boolean> {
  const candidates = buildFillSelectorCandidates(selector);
  for (const candidate of candidates) {
    try {
      if (strategy === "label") {
        await page.getByLabel(candidate, { exact: false }).first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      } else if (strategy === "placeholder") {
        await page.getByPlaceholder(candidate, { exact: false }).first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      } else if (strategy === "placeholderInput") {
        await page
          .locator(`input[placeholder="${escapeCssAttrValue(candidate)}"]:visible`)
          .first()
          .fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      } else {
        await page.locator("input[type='password']:visible").first().fill(value, { timeout: SUITE_STEP_TIMEOUT_MS });
      }
      return true;
    } catch {
      // continue
    }
  }
  return false;
}

/**
 * Executes a suite run using Playwright for each test case version in suite.
 */
export async function executeSuiteRun(prisma: PrismaClient, runId: string): Promise<void> {
  const run = await prisma.suiteRun.findUnique({
    where: { id: runId },
    include: {
      suite: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { version: { include: { testCase: true } } },
          },
        },
      },
    },
  });

  if (!run) {
    throw new Error("Không tìm thấy lần chạy suite");
  }

  const results: Array<{
    testCaseId: string;
    testCaseVersionId: string;
    status: string;
    stepLog: Array<{ step: number; message: string }>;
    screenshotUrl?: string;
  }> = [];

  let suiteFailed = false;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.route("**/*", (route) => {
      if (FAST_RESOURCE_TYPES.has(route.request().resourceType())) {
        return route.abort();
      }
      return route.continue();
    });

    for (const item of run.suite.items) {
      const content = item.version.content as { steps?: unknown[] } | null;
      const steps = Array.isArray(content?.steps) ? content.steps : [];
      const stepLog: Array<{ step: number; message: string }> = [];
      let caseStatus = "passed";
      let screenshotUrl: string | undefined;

      const page = await context.newPage();
      page.setDefaultTimeout(SUITE_STEP_TIMEOUT_MS);
      const locatorCache: SuiteLocatorCache = { click: new Map(), fill: new Map() };
      try {
        for (let i = 0; i < steps.length; i += 1) {
          const stepIndex = i + 1;
          try {
            await runSuiteStep(page, steps[i], locatorCache);
            stepLog.push({ step: stepIndex, message: "passed" });
          } catch (error) {
            caseStatus = "failed";
            suiteFailed = true;
            const message = error instanceof Error ? error.message : String(error);
            stepLog.push({ step: stepIndex, message: `failed: ${message}` });

            try {
              fs.mkdirSync("screenshots", { recursive: true });
              screenshotUrl = `screenshots/suite-${run.id}-${item.testCaseVersionId}-${stepIndex}.png`;
              await page.screenshot({ path: screenshotUrl, fullPage: true });
            } catch {
              // Ignore screenshot errors so run result is still captured.
            }
            break;
          }
        }
      } finally {
        await page.close();
      }

      results.push({
        testCaseId: item.version.testCaseId,
        testCaseVersionId: item.testCaseVersionId,
        status: caseStatus,
        stepLog,
        ...(screenshotUrl ? { screenshotUrl } : {}),
      });
    }
    await context.close();
  } finally {
    await browser.close();
  }

  await prisma.suiteRun.update({
    where: { id: runId },
    data: {
      status: suiteFailed ? "failed" : "passed",
      finishedAt: new Date(),
      results: results as object,
    },
  });
}

async function runSuiteStep(
  page: import("playwright").Page,
  rawStep: unknown,
  locatorCache?: SuiteLocatorCache,
): Promise<void> {
  if (!rawStep || typeof rawStep !== "object") {
    throw new Error("Step không hợp lệ");
  }

  const step = rawStep as {
    kind?: unknown;
    selector?: unknown;
    url?: unknown;
    value?: unknown;
    expected?: unknown;
    parameters?: unknown;
  };

  const kind = typeof step.kind === "string" ? step.kind : "";

  if (kind === "recorded.click") {
    const selector = typeof step.selector === "string" ? step.selector.trim() : "";
    if (!selector) throw new Error("recorded.click thiếu selector");
    await page.click(selector, { timeout: SUITE_STEP_TIMEOUT_MS });
    return;
  }

  if (!kind.startsWith("keyword.")) {
    throw new Error(`Step kind không hỗ trợ: ${kind || "unknown"}`);
  }

  const action = kind.slice("keyword.".length);
  const params = normalizeParams(step.parameters, step);

  switch (action) {
    case "navigate": {
      const url = asString(params.url);
      if (!url) throw new Error("keyword.navigate thiếu url");
      await page.goto(url, { timeout: SUITE_STEP_TIMEOUT_MS });
      return;
    }
    case "click": {
      const selector = asString(params.selector);
      if (!selector) throw new Error("keyword.click thiếu selector");
      if (isLikelyPlainLabel(selector) && (await tryClickBySemanticLocator(page, selector, locatorCache?.click))) return;
      await page.click(selector, { timeout: SUITE_STEP_TIMEOUT_MS }).catch(async () => {
        if (!isLikelyPlainLabel(selector)) throw new Error(`keyword.click không tìm thấy selector ${selector}`);
        if (await tryClickBySemanticLocator(page, selector, locatorCache?.click)) return;
        throw new Error(`keyword.click không tìm thấy nút "${selector}"`);
      });
      return;
    }
    case "fill": {
      const selector = asString(params.selector);
      const value = asString(params.value);
      if (!selector) throw new Error("keyword.fill thiếu selector");
      if (!value) throw new Error("keyword.fill thiếu value");
      if (isLikelyPlainLabel(selector)) {
        if (await tryFillBySemanticLocator(page, selector, value, locatorCache?.fill)) return;
      }
      await page.fill(selector, value, { timeout: SUITE_STEP_TIMEOUT_MS }).catch(async () => {
        if (!isLikelyPlainLabel(selector)) throw new Error(`keyword.fill không tìm thấy selector ${selector}`);
        if (await tryFillBySemanticLocator(page, selector, value, locatorCache?.fill)) return;
        throw new Error(`keyword.fill không tìm thấy ô nhập cho "${selector}"`);
      });
      return;
    }
    case "assertText": {
      const selector = asString(params.selector);
      const expected = asString(params.expected);
      if (!selector) throw new Error("keyword.assertText thiếu selector");
      if (!expected) throw new Error("keyword.assertText thiếu expected");
      await page.waitForSelector(selector, { timeout: SUITE_STEP_TIMEOUT_MS });
      const text = await page.locator(selector).first().textContent();
      if (!text?.includes(expected)) {
        throw new Error("keyword.assertText thất bại");
      }
      return;
    }
    default:
      throw new Error(`keyword không hỗ trợ: ${action}`);
  }
}

function normalizeParams(
  rawParams: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  if (rawParams && typeof rawParams === "object") {
    return rawParams as Record<string, unknown>;
  }
  if (typeof rawParams === "string") {
    try {
      const parsed = JSON.parse(rawParams) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // Fall back to top-level fields.
    }
  }
  return fallback;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
