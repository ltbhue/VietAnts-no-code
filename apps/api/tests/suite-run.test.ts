import { afterAll, beforeAll, expect, test } from "@playwright/test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { buildServer } from "../src/server";
import type { PrismaClient } from "../src/generated/prisma/client";

let server: Server;
let baseUrl: string;
const jwtSecret = "test-jwt-suite-run";

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;

  const mockPrisma = {
    testSuite: {
      findFirst: async () => ({
        id: "suite1",
        projectId: "p1",
        name: "Regression",
      }),
    },
    suiteRun: {
      create: async () => ({ id: "run1" }),
      findUnique: async (args: { where: { id: string }; include?: unknown }) => {
        if (args.where.id !== "run1") return null;
        if (args.include) {
          return {
            id: "run1",
            suite: {
              items: [
                {
                  testCaseVersionId: "ver1",
                  version: {
                    testCaseId: "tc1",
                    content: { steps: [{ kind: "recorded.click", selector: "[data-test='x']" }] },
                    testCase: { id: "tc1", title: "T" },
                  },
                },
              ],
            },
          };
        }
        return {
          id: "run1",
          status: "completed",
          results: [
            {
              testCaseId: "tc1",
              testCaseVersionId: "ver1",
              status: "passed",
              stepLog: [{ step: 1, message: "ok" }],
            },
          ],
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

test("POST /suites/:suiteId/runs returns run payload", async () => {
  const token = jwt.sign(
    { sub: "user-1", email: "t@test.com", role: "TESTER" },
    jwtSecret,
    { expiresIn: "1h" },
  );

  const response = await fetch(`${baseUrl}/suites/suite1/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ environment: "staging" }),
  });

  expect(response.status).toBe(202);
  const body = (await response.json()) as { runId: string; status: string };
  expect(body.runId).toBe("run1");
  expect(body.status).toBe("completed");
});
