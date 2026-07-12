const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
  if (await page.locator('.login-form').count()) {
    await page.locator('#accessInput').fill('apex');
    await page.locator('.login-form button[type="submit"]').click();
  }
  await expect(page.locator('.bible-home')).toBeVisible();
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`desktop Workspace and sidebar at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await login(page);

    await expect(page.locator('.bible-home > *')).toHaveCount(4);
    await expect(page.locator('.bible-suggestions button')).toHaveCount(6);
    await expect(page.locator('.live-quote')).toHaveCount(5);
    await expect(page.locator('.approved-nav button')).toHaveCount(9);

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      earth: getComputedStyle(document.body, '::before').backgroundImage.includes('earth-horizon'),
    }));
    expect(layout.overflow).toBe(false);
    expect(layout.earth).toBe(true);
    await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-expanded/);
    expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).width)).toBe(76);
    expect(Math.round((await page.locator('.jarvis-question-form').boundingBox()).height)).toBeGreaterThanOrEqual(100);
    if (viewport.width === 1440) await page.screenshot({ path: 'artifacts/workspace-desktop-collapsed.png', fullPage: false });

    await page.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(page.locator('.app-shell')).toHaveClass(/sidebar-expanded/);
    await page.waitForTimeout(400);
    expect(Math.round((await page.locator('.approved-sidebar').boundingBox()).width)).toBe(252);
    await expect(page.locator('.approved-nav button span:visible')).toHaveCount(9);
    if (viewport.width === 1440) await page.screenshot({ path: 'artifacts/workspace-desktop-expanded.png', fullPage: false });

    await page.getByRole('button', { name: 'Ask JARVIS' }).click();
    await expect(page.locator('.ask-page')).toBeVisible();
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`mobile workspace and drawer at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await login(page);

    const mobileState = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      earthCrop: getComputedStyle(document.body, '::before').backgroundImage.includes('earth-horizon'),
    }));
    expect(mobileState.overflow).toBe(false);
    expect(mobileState.earthCrop).toBe(true);
    if (viewport.width === 390) await page.screenshot({ path: 'artifacts/workspace-mobile-closed.png', fullPage: false });

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.locator('.app-shell')).toHaveClass(/mobile-nav-open/);
    await page.waitForTimeout(400);
    const drawerBox = await page.locator('.approved-sidebar').boundingBox();
    expect(Math.round(drawerBox.x)).toBe(0);
    expect(drawerBox.width).toBeGreaterThanOrEqual(300);
    expect(drawerBox.width).toBeLessThanOrEqual(320);
    await expect(page.locator('.approved-nav button span:visible')).toHaveCount(9);
    await expect(page.locator('.sidebar-profile')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    if (viewport.width === 390) await page.screenshot({ path: 'artifacts/workspace-mobile-open.png', fullPage: false });

    if (viewport.width === 390) await page.locator('.mobile-nav-backdrop').click({ position: { x: viewport.width - 5, y: 400 } });
    else await page.locator('.mobile-nav-close').click();
    await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-nav-open/);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });
}
