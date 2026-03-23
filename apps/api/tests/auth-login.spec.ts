import { expect, test } from "@playwright/test";

function randomEmail() {
  const rand = Math.random().toString(16).slice(2);
  return `pw_${Date.now()}_${rand}@example.com`;
}

test.describe("Auth API - /auth/login", () => {
  test("login success after register", async ({ request, baseURL }) => {
    const email = randomEmail();
    const password = "P@ssw0rd123";

    const registerRes = await request.post(`${baseURL}/auth/register`, {
      data: { email, password, fullName: "Playwright User", role: "TESTER" },
    });
    expect(registerRes.status(), "register status").toBe(201);
    const registerBody = await registerRes.json();
    expect(registerBody).toMatchObject({
      email,
      fullName: "Playwright User",
      role: "TESTER",
    });
    expect(registerBody).not.toHaveProperty("password");

    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: { email, password },
    });
    expect(loginRes.status(), "login status").toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody).toHaveProperty("token");
    expect(typeof loginBody.token).toBe("string");
    expect(loginBody.token.length).toBeGreaterThan(10);
    expect(loginBody).toHaveProperty("user");
    expect(loginBody.user).toMatchObject({
      email,
      fullName: "Playwright User",
      role: "TESTER",
    });
    expect(loginBody.user).not.toHaveProperty("password");
  });

  test("wrong password returns 401 with generic error", async ({ request, baseURL }) => {
    const email = randomEmail();
    const password = "CorrectPassword1";

    const registerRes = await request.post(`${baseURL}/auth/register`, {
      data: { email, password, fullName: "Wrong Pass Case" },
    });
    expect(registerRes.status()).toBe(201);

    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: { email, password: "wrong" },
    });
    expect(loginRes.status()).toBe(401);
    await expect(loginRes.json()).resolves.toMatchObject({ error: "Invalid credentials" });
  });

  test("non-existent user returns 401 with generic error", async ({ request, baseURL }) => {
    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: { email: randomEmail(), password: "anything" },
    });
    expect(loginRes.status()).toBe(401);
    await expect(loginRes.json()).resolves.toMatchObject({ error: "Invalid credentials" });
  });

  test("invalid payload returns 400 and includes details", async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/auth/login`, {
      data: { email: "not-an-email", password: "" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid payload");
    expect(body).toHaveProperty("details");
  });
});

