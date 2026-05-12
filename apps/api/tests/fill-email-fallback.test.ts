import { expect, test } from "@playwright/test";
import { buildAutoFillFallbackSelectors } from "../src/services/executor";

test("email label gets stable fallback selectors", async () => {
  const selectors = buildAutoFillFallbackSelectors("Email");
  expect(selectors).toContain("input[type='email']:visible");
  expect(selectors).toContain("input[name='email']:visible");
  expect(selectors).toContain("input[placeholder*='email' i]:visible");
});

test("password label gets stable fallback selectors", async () => {
  const selectors = buildAutoFillFallbackSelectors("Mật khẩu");
  expect(selectors).toContain("input[type='password']:visible");
});
