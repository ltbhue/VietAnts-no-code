import { PrismaClient } from "../generated/prisma/client";
import fs from "node:fs";
import { chromium } from "playwright";
import { notifyTelegramOnFailure } from "./telegram";
import { createLinearIssueOnFailure } from "./linear";

export async function executeScriptRun(opts: {
  prisma: PrismaClient;
  scriptId: string;
  userId: string;
  dataSetId?: string | null;
  browserName?: "chromium";
}) {
  const { prisma, scriptId, userId, dataSetId, browserName = "chromium" } = opts;

  const script = await prisma.testScript.findUnique({
    where: { id: scriptId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!script) throw new Error("Script not found");

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
    const browser = await chromium.launch();
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
              message: `Row ${rowIndex + 1}`,
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
            `❌ *Test run failed*`,
            ``,
            `*Script*: ${script.name}`,
            `*Run ID*: ${run.id}`,
            `*Step order*: ${stepOrder}`,
            `*Error*: ${errorMessage}`,
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

  switch (keyword) {
    case "navigate":
      if (typeof params.url !== "string" || !params.url.trim()) {
        const url = params.url ?? dataRow.url;
        if (typeof url !== "string" || !url.trim()) {
          throw new Error("navigate: missing parameters.url");
        }
        await page.goto(url);
      } else {
        await page.goto(params.url);
      }
      break;
    case "click":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("click: missing parameters.selector");
      }
      await page.click(params.selector);
      break;
    case "fill":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("fill: missing parameters.selector");
      }
      await page.fill(params.selector, params.value ?? dataRow[params.dataKey]);
      break;
    case "assertText":
      if (typeof params.selector !== "string" || !params.selector.trim()) {
        throw new Error("assertText: missing parameters.selector");
      }
      await page.waitForSelector(params.selector);
      const text = await page.textContent(params.selector);
      const expected = params.expected ?? dataRow[params.dataKey];
      if (typeof expected !== "string" || !expected.trim()) {
        throw new Error("assertText: missing parameters.expected or parameters.dataKey");
      }
      if (!text?.includes(expected)) {
        throw new Error("Text assertion failed");
      }
      break;
    default:
      throw new Error(`Unknown keyword: ${keyword}`);
  }
}

