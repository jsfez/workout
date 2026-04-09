import { argosScreenshot } from "@argos-ci/playwright";
import { test, expect, type Page } from "@playwright/test";

async function expectHeadingAndCapture(
  page: Page,
  heading: string,
  screenshotName: string,
) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  await argosScreenshot(page, screenshotName, { fullPage: false });
}

test("test pages", async ({ page }) => {
  await page.goto("/");
  await expectHeadingAndCapture(page, "Mon programme", "dashboard");

  await page
    .getByRole("button", {
      name: "#1 WEEK 1 — #1 7 exercices",
    })
    .click();
  await expectHeadingAndCapture(page, "WEEK 1 — #1", "session-week-1-1");

  await page
    .getByRole("button", {
      name: "1 Back Squat 3×6 RPE 7 3-4 min",
    })
    .click();
  await expectHeadingAndCapture(page, "Back Squat", "exercise-back-squat");
});

test("direct URL: session page", async ({ page }) => {
  await page.goto("/sessions/week1-1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "WEEK 1 — #1",
  );
});

test("direct URL: exercise page", async ({ page }) => {
  await page.goto("/sessions/week1-1/exercises/1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Back Squat",
  );
});
