import { PrismaClient } from "../generated/prisma/client";
import fs from "node:fs";
import { chromium, firefox, webkit } from "playwright";
import { createLinearIssueOnFailure } from "./linear";

const STEP_TIMEOUT_MS_MIN = 1000;
const STEP_TIMEOUT_MS_MAX = 180_000;
const FAST_DEFAULT_ACTION_TIMEOUT_MS = 6000;
const SEMANTIC_LOOKUP_TIMEOUT_MS = 1200;
const RESULT_BATCH_SIZE = 50;
const FAST_RESOURCE_TYPES = new Set(["image", "font", "media"]);

type LocatorCache = {
  click: Map<string, "roleButton" | "buttonText" | "submitValue" | "text" | "submitFallback">;
  fill: Map<string, "label" | "placeholder" | "placeholderInput" | "passwordInput">;
};

/** `parameters.timeoutMs`: giới hạn thời gian thao tác Playwright cho bước này (tùy chọn). */
function playwrightActionTimeoutOpts(parameters: unknown): { timeout?: number } {
  let params: Record<string, unknown> = {};
  if (typeof parameters === "string") {
    try {
      params = JSON.parse(parameters) as Record<string, unknown>;
    } catch {
      return {};
    }
  } else if (parameters && typeof parameters === "object") {
    params = parameters as Record<string, unknown>;
  }
  const raw = params.timeoutMs;
  if (raw === undefined || raw === null || raw === "") {
    return { timeout: FAST_DEFAULT_ACTION_TIMEOUT_MS };
  }
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return {};
  const ms = Math.min(Math.max(Math.floor(n), STEP_TIMEOUT_MS_MIN), STEP_TIMEOUT_MS_MAX);
  return { timeout: ms };
}

function isLikelyPlainLabel(selector: string): boolean {
  const s = selector.trim();
  if (!s) return false;
  // Nếu có ký tự cú pháp selector/cú pháp engine Playwright thì giữ nguyên.
  if (/[.#:[\]>+~=()'"`]/.test(s)) return false;
  if (s.includes("=")) return false;
  return true;
}

export function buildFillSelectorCandidates(selector: string): string[] {
  const raw = selector.trim();
  if (!raw) return [];
  const normalized = raw
    .replace(/^(nhập|điền|enter)\s+/i, "")
    .replace(/\s+(đi|vào)$/i, "")
    .trim();
  return normalized && normalized.toLowerCase() !== raw.toLowerCase() ? [raw, normalized] : [raw];
}

export function buildAutoFillFallbackSelectors(selector: string): string[] {
  const candidates = buildFillSelectorCandidates(selector);
  const fallbackSelectors = new Set<string>();

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (/email|e-mail|thư điện tử/.test(normalized)) {
      fallbackSelectors.add("input[type='email']:visible");
      fallbackSelectors.add("input[name='email']:visible");
      fallbackSelectors.add("input[name*='email' i]:visible");
      fallbackSelectors.add("input[id*='email' i]:visible");
      fallbackSelectors.add("input[placeholder*='email' i]:visible");
      fallbackSelectors.add("input[autocomplete='email']:visible");
    }
    if (/mật khẩu|mat khau|password|pass/.test(normalized)) {
      fallbackSelectors.add("input[type='password']:visible");
      fallbackSelectors.add("input[name='password']:visible");
      fallbackSelectors.add("input[id*='password' i]:visible");
      fallbackSelectors.add("input[autocomplete='current-password']:visible");
    }
  }
  return [...fallbackSelectors];
}

function escapeCssAttrValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getPageAndFrameContexts(page: import("playwright").Page): Array<import("playwright").Page | import("playwright").Frame> {
  return [page, ...page.frames()];
}

function semanticLookupTimeoutOpts(timeOpts: { timeout?: number }): { timeout: number } {
  const requested = typeof timeOpts.timeout === "number" ? timeOpts.timeout : FAST_DEFAULT_ACTION_TIMEOUT_MS;
  return { timeout: Math.max(STEP_TIMEOUT_MS_MIN, Math.min(requested, SEMANTIC_LOOKUP_TIMEOUT_MS)) };
}

async function tryFillBySemanticLocator(
  page: import("playwright").Page,
  selector: string,
  fillValue: string,
  timeOpts: { timeout?: number },
  cache?: LocatorCache["fill"],
): Promise<boolean> {
  const semanticOpts = semanticLookupTimeoutOpts(timeOpts);
  const cachedStrategy = cache?.get(selector);
  if (cachedStrategy && (await tryFillWithStrategy(page, selector, fillValue, semanticOpts, cachedStrategy))) {
    return true;
  }

  const candidates = buildFillSelectorCandidates(selector);
  const contexts = getPageAndFrameContexts(page);
  for (const candidate of candidates) {
    for (const ctx of contexts) {
      try {
        await ctx.getByLabel(candidate, { exact: false }).first().fill(fillValue, semanticOpts);
        cache?.set(selector, "label");
        return true;
      } catch {
        // continue
      }
      try {
        await ctx.getByPlaceholder(candidate, { exact: false }).first().fill(fillValue, semanticOpts);
        cache?.set(selector, "placeholder");
        return true;
      } catch {
        // continue
      }

      const escaped = escapeCssAttrValue(candidate);
      try {
        await ctx.locator(`input[placeholder="${escaped}"]:visible`).first().fill(fillValue, semanticOpts);
        cache?.set(selector, "placeholderInput");
        return true;
      } catch {
        // continue
      }
    }
  }

  if (candidates.some((s) => /mật khẩu|password/i.test(s))) {
    for (const ctx of contexts) {
      try {
        await ctx.locator("input[type='password']:visible").first().fill(fillValue, semanticOpts);
        cache?.set(selector, "passwordInput");
        return true;
      } catch {
        // continue
      }
    }
  }

  for (const fallbackSelector of buildAutoFillFallbackSelectors(selector)) {
    for (const ctx of contexts) {
      try {
        await ctx.locator(fallbackSelector).first().fill(fillValue, semanticOpts);
        return true;
      } catch {
        // continue
      }
    }
  }

  return false;
}

async function tryClickBySemanticLocator(
  page: import("playwright").Page,
  selector: string,
  timeOpts: { timeout?: number },
  cache?: LocatorCache["click"],
): Promise<boolean> {
  const semanticOpts = semanticLookupTimeoutOpts(timeOpts);
  const cachedStrategy = cache?.get(selector);
  if (cachedStrategy && (await tryClickWithStrategy(page, selector, semanticOpts, cachedStrategy))) {
    return true;
  }

  const contexts = getPageAndFrameContexts(page);
  for (const ctx of contexts) {
    try {
      await ctx.getByRole("button", { name: selector, exact: false }).first().click(semanticOpts);
      cache?.set(selector, "roleButton");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx.locator(`button:has-text("${escapeCssAttrValue(selector)}")`).first().click(semanticOpts);
      cache?.set(selector, "buttonText");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx
        .locator(`input[type="submit"][value="${escapeCssAttrValue(selector)}"]:visible`)
        .first()
        .click(semanticOpts);
      cache?.set(selector, "submitValue");
      return true;
    } catch {
      // continue
    }
    try {
      await ctx.locator(`text=${selector}`).first().click(semanticOpts);
      cache?.set(selector, "text");
      return true;
    } catch {
      // continue
    }

    // Fallback cho ý nghĩa "đăng nhập/login": click nút submit nhìn thấy đầu tiên.
    if (/đăng nhập|dang nhap|login|sign in/i.test(selector)) {
      try {
        await ctx.locator("button[type='submit']:visible, input[type='submit']:visible").first().click(semanticOpts);
        cache?.set(selector, "submitFallback");
        return true;
      } catch {
        // continue
      }
    }
  }
  return false;
}

async function tryClickWithStrategy(
  page: import("playwright").Page,
  selector: string,
  timeOpts: { timeout?: number },
  strategy: "roleButton" | "buttonText" | "submitValue" | "text" | "submitFallback",
): Promise<boolean> {
  const contexts = getPageAndFrameContexts(page);
  for (const ctx of contexts) {
    try {
      if (strategy === "roleButton") {
        await ctx.getByRole("button", { name: selector, exact: false }).first().click(timeOpts);
      } else if (strategy === "buttonText") {
        await ctx.locator(`button:has-text("${escapeCssAttrValue(selector)}")`).first().click(timeOpts);
      } else if (strategy === "submitValue") {
        await ctx
          .locator(`input[type="submit"][value="${escapeCssAttrValue(selector)}"]:visible`)
          .first()
          .click(timeOpts);
      } else if (strategy === "text") {
        await ctx.locator(`text=${selector}`).first().click(timeOpts);
      } else {
        await ctx.locator("button[type='submit']:visible, input[type='submit']:visible").first().click(timeOpts);
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
  fillValue: string,
  timeOpts: { timeout?: number },
  strategy: "label" | "placeholder" | "placeholderInput" | "passwordInput",
): Promise<boolean> {
  const candidates = buildFillSelectorCandidates(selector);
  const contexts = getPageAndFrameContexts(page);
  for (const candidate of candidates) {
    for (const ctx of contexts) {
      try {
        if (strategy === "label") {
          await ctx.getByLabel(candidate, { exact: false }).first().fill(fillValue, timeOpts);
        } else if (strategy === "placeholder") {
          await ctx.getByPlaceholder(candidate, { exact: false }).first().fill(fillValue, timeOpts);
        } else if (strategy === "placeholderInput") {
          await ctx.locator(`input[placeholder="${escapeCssAttrValue(candidate)}"]:visible`).first().fill(fillValue, timeOpts);
        } else {
          await ctx.locator("input[type='password']:visible").first().fill(fillValue, timeOpts);
        }
        return true;
      } catch {
        // continue
      }
    }
  }
  return false;
}

export async function executeScriptRun(opts: {
  prisma: PrismaClient;
  scriptId: string;
  userId: string;
  dataSetId?: string | null;
  browserName?: "chromium" | "firefox" | "webkit";
}) {
  const { prisma, scriptId, userId, dataSetId, browserName = "chromium" } = opts;

  const script = await prisma.testScript.findUnique({
    where: { id: scriptId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!script) throw new Error("Không tìm thấy kịch bản kiểm thử");

  const dataSet = dataSetId
    ? await prisma.dataSet.findUnique({ where: { id: dataSetId } })
    : null;

  const run = await prisma.testRun.create({
    data: {
      scriptId,
      userId,
      status: "queued",
      browser: browserName,
      dataSetId: dataSet?.id,
    },
  });

  let browser: import("playwright").Browser | null = null;
  try {
    const launcher = browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium;
    browser = await launcher.launch();
    const context = await browser.newContext();
    await context.route("**/*", (route) => {
      if (FAST_RESOURCE_TYPES.has(route.request().resourceType())) {
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(FAST_DEFAULT_ACTION_TIMEOUT_MS);

    const rows: any[] = dataSet ? ((dataSet.rows as any[]) ?? []) : [null];
    const locatorCache: LocatorCache = { click: new Map(), fill: new Map() };
    const pendingResults: Array<{
      runId: string;
      stepOrder: number;
      status: "passed" | "failed";
      message: string;
      screenshot?: string;
    }> = [];

    const flushResults = async (): Promise<void> => {
      if (pendingResults.length === 0) return;
      const batch = pendingResults.splice(0, pendingResults.length);
      await prisma.testResult.createMany({ data: batch });
    };

    for (const [rowIndex, row] of rows.entries()) {
      for (const step of script.steps) {
        const stepOrder = step.order;
        try {
          await runKeywordStep(page, step.keyword, step.parameters, row, locatorCache);
          pendingResults.push({
            runId: run.id,
            stepOrder,
            status: "passed",
            message: `Dòng dữ liệu ${rowIndex + 1}`,
          });
          if (pendingResults.length >= RESULT_BATCH_SIZE) {
            await flushResults();
          }
        } catch (err: any) {
          await flushResults();
          const screenshotPath = `screenshots/${run.id}-${stepOrder}.png`;
          // Ensure screenshots folder exists for first run.
          try {
            fs.mkdirSync("screenshots", { recursive: true });
          } catch {
            // ignore; Playwright will surface the error if writing fails
          }
          await page.screenshot({ path: screenshotPath, fullPage: true });
          await prisma.testResult.create({
            data: {
              runId: run.id,
              stepOrder,
              status: "failed",
              message: String(err?.message ?? err),
              screenshot: screenshotPath,
            },
          });

          const errorMessage = String(err?.message ?? err);
          // Auto-create bug trên Linear (nếu đã cấu hình LINEAR_API_KEY & LINEAR_TEAM_ID)
          await createLinearIssueOnFailure({
            scriptName: script.name,
            runId: run.id,
            stepOrder,
            errorMessage,
          });

          throw err;
        }
      }
    }
    await flushResults();

    await prisma.testRun.update({
      where: { id: run.id },
      data: { status: "passed", finishedAt: new Date() },
    });
  } catch (err) {
    await prisma.testRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date() },
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {
        // no-op; run status was already persisted
      });
    }
  }

  return prisma.testRun.findUnique({
    where: { id: run.id },
    include: { results: true },
  });
}

async function runKeywordStep(
  page: import("playwright").Page,
  keyword: string,
  parameters: any,
  row: any,
  locatorCache?: LocatorCache,
) {
  // Normalize parameters so executor can run even if parameters are accidentally sent as string.
  let params: any = parameters ?? {};
  if (typeof parameters === "string") {
    try {
      params = JSON.parse(parameters);
    } catch {
      params = {};
    }
  }
  const dataRow = row ?? {};
  const timeOpts = playwrightActionTimeoutOpts(params);

  switch (keyword) {
    case "navigate":
      if (typeof params.url !== "string" || !params.url.trim()) {
        const url = params.url ?? dataRow.url;
        if (typeof url !== "string" || !url.trim()) {
          throw new Error("navigate: thiếu parameters.url");
        }
        await page.goto(url, timeOpts);
      } else {
        await page.goto(params.url, timeOpts);
      }
      break;
    case "click":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("click: thiếu parameters.selector");
      }
      {
        const selector = params.selector.trim();
        if (isLikelyPlainLabel(selector) && (await tryClickBySemanticLocator(page, selector, timeOpts, locatorCache?.click))) break;
        await page.click(selector, timeOpts).catch(async () => {
          if (!isLikelyPlainLabel(selector)) throw new Error(`click: không tìm thấy selector ${selector}`);
          if (await tryClickBySemanticLocator(page, selector, timeOpts, locatorCache?.click)) return;
          throw new Error(`click: không tìm thấy nút "${selector}"`);
        });
      }
      break;
    case "fill":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("fill: thiếu parameters.selector");
      }
      const fillValue = params.value ?? dataRow[params.dataKey];
      const selector = params.selector.trim();
      if (isLikelyPlainLabel(selector)) {
        if (await tryFillBySemanticLocator(page, selector, fillValue, timeOpts, locatorCache?.fill)) {
          break;
        }
      }
      await page.fill(selector, fillValue, timeOpts).catch(async () => {
        if (!isLikelyPlainLabel(selector)) throw new Error(`fill: không tìm thấy selector ${selector}`);
        if (await tryFillBySemanticLocator(page, selector, fillValue, timeOpts, locatorCache?.fill)) return;
        throw new Error(`fill: không tìm thấy ô nhập cho "${selector}"`);
      });
      break;
    case "assertText":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("assertText: thiếu parameters.selector");
      }
      await page.waitForSelector(params.selector, timeOpts);
      const loc = page.locator(params.selector).first();
      const text = await loc.textContent(timeOpts);
      const expected = params.expected ?? dataRow[params.dataKey];
      if (typeof expected !== "string" || !expected.trim()) {
        throw new Error("assertText: thiếu parameters.expected hoặc parameters.dataKey");
      }
      if (!text?.includes(expected)) {
        throw new Error("Kiểm tra nội dung văn bản thất bại");
      }
      break;
    default:
      throw new Error(`Từ khóa không được hỗ trợ: ${keyword}`);
  }
}

