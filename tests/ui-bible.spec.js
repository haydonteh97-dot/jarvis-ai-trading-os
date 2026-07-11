const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
  if (await page.locator('.login-form').count()) {
    await page.locator('#accessInput').fill('apex');
    await page.locator('.login-form button[type="submit"]').click();
  }
  await expect(page.locator('.bible-home')).toBeVisible();
}

test('desktop workspace follows the locked Bible hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await login(page);

  await expect(page.locator('.bible-home > *')).toHaveCount(4);
  await expect(page.locator('.bible-suggestions button')).toHaveCount(6);
  await expect(page.locator('.live-quote')).toHaveCount(5);
  await expect(page.locator('.approved-nav button')).toHaveCount(9);
  await expect(page.locator('.connection-badge')).toHaveCount(0);
  await expect(page.locator('.language-switch')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-expanded/);
  expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).width)).toBe(252);
  await expect(page.locator('.approved-nav button').first().locator('span')).toBeVisible();
  expect((await page.locator('.approved-nav').boundingBox()).width).toBeGreaterThan(200);

  await page.locator('[data-ui-language="zh"]').click();
  await expect(page.locator('.approved-nav button').first()).toHaveAccessibleName('工作空间');
  await expect(page.locator('.bible-greeting p')).toContainText(/早上好|下午好|晚上好/);
  await expect(page.locator('[data-ui-language="zh"]')).toHaveClass(/active/);
  await page.locator('[data-ui-language="en"]').click();
  await expect(page.locator('.approved-nav button').first()).toHaveAccessibleName('Workspace');

  await page.screenshot({ path: 'artifacts/workspace-desktop.png', fullPage: false });
  await page.screenshot({ path: 'artifacts/sidebar-desktop.png', fullPage: false });

  await page.getByRole('button', { name: 'Ask JARVIS' }).click();
  await expect(page.locator('.ask-page')).toBeVisible();
  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-expanded/);
  await page.getByRole('button', { name: 'Expand navigation' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-expanded/);
  await page.screenshot({ path: 'artifacts/ask-jarvis-desktop.png', fullPage: true });
});

test('mobile workspace has no overflow and the drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/mobile-nav-open/);
  await page.waitForTimeout(400);
  expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).x)).toBe(0);

  await page.locator('.mobile-nav-close').click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-nav-open/);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/workspace-mobile.png', fullPage: true });
});
