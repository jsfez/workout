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
    .getByRole("button", { name: "WEEK 1 — #1", exact: false })
    .click();
  await expectHeadingAndCapture(page, "WEEK 1 — #1", "session-week-1-1");

  await page
    .getByRole("button", { name: "Back Squat", exact: false })
    .first()
    .click();
  await expectHeadingAndCapture(page, "Back Squat", "exercise-back-squat");
});
