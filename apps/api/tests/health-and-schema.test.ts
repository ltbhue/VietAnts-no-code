import { afterAll, beforeAll, expect, test } from "@playwright/test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { buildServer } from "../src/server";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = buildServer();

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
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

test("GET /health returns minimal ok payload", async () => {
  const response = await fetch(`${baseUrl}/health`);

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
