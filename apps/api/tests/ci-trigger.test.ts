import { afterAll, beforeAll, expect, test } from "@playwright/test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { buildServer } from "../src/server";
import type { PrismaClient } from "../src/generated/prisma/client";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.CI_API_TOKEN = "valid-ci-token";

  const mockPrisma = {
    testSuite: {
      findUnique: async () => ({
        id: "suite1",
        projectId: "p1",
        name: "CI Suite",
      }),
    },
    suiteRun: {
      create: async () => ({ id: "run-ci-1" }),
      findUnique: async (args: { where: { id: string }; include?: unknown }) => {
        if (args.where.id !== "run-ci-1") return null;
        if (args.include) {
          return {
            id: "run-ci-1",
            suite: {
              items: [
                {
                  testCaseVersionId: "ver1",
                  version: {
                    testCaseId: "tc1",
                    content: { steps: [] },
                    testCase: { id: "tc1", title: "T" },
                  },
                },
              ],
            },
          };
        }
        return {
          id: "run-ci-1",
          status: "completed",
          results: [],
        };
      },
      update: async () => ({}),
    },
  } as unknown as PrismaClient;

  const app = buildServer({ prisma: mockPrisma });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const info = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${info.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("rejects invalid CI token", async () => {
  const response = await fetch(`${baseUrl}/ci/trigger-suite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid",
    },
    body: JSON.stringify({ suiteId: "suite1" }),
  });
  expect(response.status).toBe(403);
  const body = (await response.json()) as { error: string };
  expect(body.error).toBe("forbidden_scope");
});

test("accepts valid CI token and returns run", async () => {
  const response = await fetch(`${baseUrl}/ci/trigger-suite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid-ci-token",
    },
    body: JSON.stringify({ suiteId: "suite1", buildId: "b-12", commitSha: "abc" }),
  });
  expect(response.status).toBe(202);
  const body = (await response.json()) as { runId: string };
  expect(body.runId).toBe("run-ci-1");
});
