import { expect, test } from "@playwright/test";
import { buildServer } from "../src/server";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

test("health endpoint responds ok without prisma", async () => {
  const app = buildServer();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const info = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${info.port}`;
  try {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
