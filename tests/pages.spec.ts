import { test, expect } from "@playwright/test";

test("test pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mon programme",
  );

  await page
    .getByRole("button", {
      name: "#1 WEEK 1 — #1 7 exercices",
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "WEEK 1 — #1",
  );

  await page
    .getByRole("button", {
      name: "1 Back Squat 3×6 RPE 7 3-4 min",
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Back Squat",
  );
});
