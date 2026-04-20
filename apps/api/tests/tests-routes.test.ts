import { afterAll, beforeAll, expect, test } from "@playwright/test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { buildServer } from "../src/server";
import type { PrismaClient } from "../src/generated/prisma/client";

let server: Server;
let baseUrl: string;

const jwtSecret = "test-jwt-secret-for-tests-routes";

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
      create: async ({
        data,
      }: {
        data: {
          title: string;
          projectId: string;
          versions: { create: { version: number; content: unknown } };
        };
      }) => {
        const content = data.versions.create.content as {
          lifecycle: string;
          platform: string;
          steps: unknown[];
        };
        return {
          id: "tc_1",
          title: data.title,
          projectId: data.projectId,
          versions: [
            {
              id: "v1",
              version: 1,
              content,
            },
          ],
        };
      },
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

test("POST /projects/:projectId/tests creates draft test and recorded version", async () => {
  const token = jwt.sign(
    { sub: "user-1", email: "t@test.com", role: "TESTER" },
    jwtSecret,
    { expiresIn: "1h" },
  );

  const response = await fetch(`${baseUrl}/projects/p1/tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Login happy path",
      platform: "desktop-web",
      steps: [{ kind: "recorded.click", selector: "[data-test='login']" }],
    }),
  });

  expect(response.status).toBe(201);
  const body = (await response.json()) as {
    id: string;
    lifecycle: string;
    version: number;
    name: string;
  };
  expect(body.lifecycle).toBe("Draft");
  expect(body.version).toBe(1);
  expect(body.name).toBe("Login happy path");
  expect(body.id).toBe("tc_1");
});
