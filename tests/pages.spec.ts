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

async function openDashboard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Jeremy", exact: false }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mon programme",
  );
  await expect(page.getByRole("button", { name: /Toutes/ })).toBeVisible();
}

test("profile selection", async ({ page }) => {
  await page.goto("/");
  await expectHeadingAndCapture(page, "Qui s'entraine ?", "profile-selection");
});

test("dashboard", async ({ page }) => {
  await openDashboard(page);
  await argosScreenshot(page, "dashboard", { fullPage: false });
});

test("dashboard completed filter", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: /Terminées/ }).click();
  await expect(page.getByText("Séances terminées")).toBeVisible();
  await argosScreenshot(page, "dashboard-completed-filter", {
    fullPage: false,
  });
});

test("dashboard remaining filter", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: /Restantes/ }).click();
  await expect(page.getByText("Séances restantes")).toBeVisible();
  await argosScreenshot(page, "dashboard-remaining-filter", {
    fullPage: false,
  });
});

test("session page", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "WEEK 1 — #1", exact: false }).click();
  await expectHeadingAndCapture(page, "WEEK 1 — #1", "session-week-1-1");
});

test("exercise page", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "WEEK 1 — #1", exact: false }).click();
  await page
    .getByRole("button", { name: "Back Squat", exact: false })
    .first()
    .click();
  await expectHeadingAndCapture(page, "Back Squat", "exercise-back-squat");
});
