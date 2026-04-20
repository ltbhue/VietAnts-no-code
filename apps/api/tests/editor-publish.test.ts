import { afterAll, beforeAll, expect, test } from "@playwright/test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { buildServer } from "../src/server";
import type { PrismaClient } from "../src/generated/prisma/client";

let server: Server;
let baseUrl: string;
const jwtSecret = "test-jwt-secret-editor-publish";

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;

  const mockPrisma = {
    project: {
      findFirst: async ({ where }: { where: { id: string; ownerId: string } }) => {
        if (where.id === "p1" && where.ownerId === "user-1") {
          return { id: "p1", ownerId: "user-1" };
        }
        return null;
      },
    },
    testCase: {
      findFirst: async () => ({
        id: "tc1",
        projectId: "p1",
        title: "T",
        versions: [
          {
            id: "ver1",
            version: 1,
            content: {
              lifecycle: "Draft",
              platform: "desktop-web",
              steps: [{ kind: "recorded.click", selector: "[data-test='login']" }],
            },
          },
        ],
      }),
    },
    testCaseVersion: {
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

test("POST publish returns Published when validation passes", async () => {
  const token = jwt.sign(
    { sub: "user-1", email: "t@test.com", role: "TESTER" },
    jwtSecret,
    { expiresIn: "1h" },
  );

  const response = await fetch(`${baseUrl}/projects/p1/tests/tc1/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status).toBe(200);
  const body = (await response.json()) as { lifecycle: string; version: number };
  expect(body.lifecycle).toBe("Published");
  expect(body.version).toBe(1);
});
