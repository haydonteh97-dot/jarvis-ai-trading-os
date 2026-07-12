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
  await expect(page.locator('.language-switch')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notifications' })).toHaveCount(0);
  await expect(page.locator('.premium-badge')).toBeVisible();
  await expect(page.locator('.profile-pill')).toBeVisible();

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    earth: getComputedStyle(document.body, '::before').backgroundImage.includes('earth-horizon'),
  }));
  expect(layout.overflow).toBe(false);
  expect(layout.earth).toBe(true);
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-expanded/);
  expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).width)).toBe(76);
  expect(Math.round((await page.locator('.jarvis-question-form').boundingBox()).height)).toBeGreaterThanOrEqual(100);
  await page.screenshot({ path: 'artifacts/workspace-desktop.png', fullPage: false });

  await page.getByRole('button', { name: 'Expand navigation' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-expanded/);
  await page.waitForTimeout(400);
  expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).width)).toBe(252);
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('.settings-language-control')).toBeVisible();
  await page.locator('[data-settings-language="zh"]').click();
  expect(await page.evaluate(() => localStorage.getItem('jarvis-ui-language'))).toBe('zh');
  await page.locator('[data-settings-language="en"]').click();
  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-expanded/);
  await page.screenshot({ path: 'artifacts/settings-language-desktop.png', fullPage: false });
});

test('mobile workspace has no overflow and the drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/mobile-nav-open/);
  await page.waitForTimeout(400);
  const drawerBox = await page.locator('.approved-sidebar').boundingBox();
  expect(Math.round(drawerBox.x)).toBe(0);
  expect(drawerBox.width).toBeGreaterThanOrEqual(280);
  expect(drawerBox.width).toBeLessThanOrEqual(300);
  await expect(page.locator('.approved-nav button span:visible')).toHaveCount(9);
  await expect(page.locator('.sidebar-profile')).toBeVisible();
  await page.screenshot({ path: 'artifacts/mobile-drawer.png', fullPage: false });

  await page.locator('.mobile-nav-close').click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-nav-open/);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/workspace-mobile.png', fullPage: true });
});
