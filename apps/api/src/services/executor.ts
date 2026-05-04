import { PrismaClient } from "../generated/prisma/client";
import fs from "node:fs";
import { chromium, firefox, webkit } from "playwright";
import { notifyTelegramOnFailure } from "./telegram";
import { createLinearIssueOnFailure } from "./linear";

const STEP_TIMEOUT_MS_MIN = 1000;
const STEP_TIMEOUT_MS_MAX = 180_000;

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
  if (raw === undefined || raw === null || raw === "") return {};
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

  try {
    const launcher = browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium;
    const browser = await launcher.launch();
    const page = await browser.newPage();

    const rows: any[] = dataSet ? ((dataSet.rows as any[]) ?? []) : [null];

    for (const [rowIndex, row] of rows.entries()) {
      for (const step of script.steps) {
        const stepOrder = step.order;
        try {
          await runKeywordStep(page, step.keyword, step.parameters, row);
          await prisma.testResult.create({
            data: {
              runId: run.id,
              stepOrder,
              status: "passed",
              message: `Dòng dữ liệu ${rowIndex + 1}`,
            },
          });
        } catch (err: any) {
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

          // Gửi thông báo Telegram khi bước fail
          const errorMessage = String(err?.message ?? err);
          const text = [
            `❌ *Lần chạy test bị lỗi*`,
            ``,
            `*Kịch bản*: ${script.name}`,
            `*Run ID*: ${run.id}`,
            `*Thứ tự bước*: ${stepOrder}`,
            `*Lỗi*: ${errorMessage}`,
          ].join("\n");
          await notifyTelegramOnFailure(text);

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

    await browser.close();

    await prisma.testRun.update({
      where: { id: run.id },
      data: { status: "passed", finishedAt: new Date() },
    });
  } catch (err) {
    await prisma.testRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date() },
    });
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
        await page.click(selector, timeOpts).catch(async (firstErr) => {
          if (!isLikelyPlainLabel(selector)) throw firstErr;
          // Hỗ trợ nhập kiểu "Continue"/"Đăng nhập": ưu tiên role button, sau đó text locator.
          try {
            await page.getByRole("button", { name: selector, exact: false }).click(timeOpts);
            return;
          } catch {
            await page.locator(`text=${selector}`).first().click(timeOpts);
          }
        });
      }
      break;
    case "fill":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("fill: thiếu parameters.selector");
      }
      const fillValue = params.value ?? dataRow[params.dataKey];
      const selector = params.selector.trim();
      await page.fill(selector, fillValue, timeOpts).catch(async (firstErr) => {
        if (!isLikelyPlainLabel(selector)) throw firstErr;
        // Hỗ trợ nhập kiểu "Email" / "Password": ưu tiên label rồi placeholder.
        try {
          await page.getByLabel(selector, { exact: false }).fill(fillValue, timeOpts);
          return;
        } catch {
          await page.getByPlaceholder(selector, { exact: false }).fill(fillValue, timeOpts);
        }
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

