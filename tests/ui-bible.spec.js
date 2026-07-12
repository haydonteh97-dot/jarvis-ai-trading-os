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

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 390, height: 650 }]) {
  test(`mobile workspace and drawer at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await login(page);

    const mobileState = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      earthCrop: getComputedStyle(document.body, '::before').backgroundImage.includes('earth-horizon'),
    }));
    expect(mobileState.overflow).toBe(false);
    expect(mobileState.earthCrop).toBe(true);
    if (viewport.width === 390 && viewport.height === 844) await page.screenshot({ path: 'artifacts/workspace-mobile-closed.png', fullPage: false });

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
    const navBox = await page.locator('.approved-nav').boundingBox();
    const footerBox = await page.locator('.sidebar-footer').boundingBox();
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(footerBox.y + 1);
    if (viewport.width === 390 && viewport.height === 844) await page.screenshot({ path: 'artifacts/workspace-mobile-open.png', fullPage: false });
    if (viewport.height === 650) await page.screenshot({ path: 'artifacts/mobile-drawer-compact.png', fullPage: false });

    if (viewport.width === 390) await page.locator('.mobile-nav-backdrop').click({ position: { x: viewport.width - 5, y: Math.min(400, viewport.height - 5) } });
    else await page.locator('.mobile-nav-close').click();
    await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-nav-open/);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });
}

test.describe('Sprint 4 AI Analysis', () => {
  test('desktop structured analysis, controls, loading and contextual handoff', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.getByRole('button', { name: 'AI Analysis' }).click();

    await expect(page.locator('.ai-analysis-page')).toBeVisible();
    await expect(page.locator('.analysis-module')).toHaveCount(13);
    await expect(page.locator('.market-overview-module')).toBeVisible();
    await expect(page.locator('.mtf-module')).toBeVisible();
    await expect(page.locator('.structure-module')).toBeVisible();
    await expect(page.locator('.bullish-module')).toBeVisible();
    await expect(page.locator('.bearish-module')).toBeVisible();
    await expect(page.getByText('Verified macro source not connected', { exact: true })).toBeVisible();
    await expect(page.getByText('Live news source not connected', { exact: true })).toBeVisible();
    await expect(page.getByText('Awaiting verified market data', { exact: true }).first()).toBeVisible();

    await page.locator('#analysisAssetSelect').selectOption('EURUSD');
    await expect(page.locator('.analysis-loading-state')).toBeVisible();
    await expect(page.locator('#analysisAssetSelect')).toHaveValue('EURUSD');
    await expect(page.locator('.analysis-loading-state')).toBeHidden({ timeout: 3000 });

    await page.locator('#analysisTimeframeSelect').selectOption('H4');
    await expect(page.locator('.analysis-loading-state')).toBeVisible();
    await expect(page.locator('#analysisTimeframeSelect')).toHaveValue('H4');
    await expect(page.locator('.analysis-loading-state')).toBeHidden({ timeout: 3000 });

    const refresh = page.locator('#refreshAiAnalysis');
    await refresh.click();
    await expect(page.locator('.analysis-loading-state')).toBeVisible();
    await expect(page.locator('#refreshAiAnalysis')).toBeDisabled();
    await expect(page.locator('.analysis-loading-state')).toBeHidden({ timeout: 3000 });

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overlaps: [...document.querySelectorAll('.analysis-module')].some((element, index, items) => {
        const a = element.getBoundingClientRect();
        return items.slice(index + 1).some((other) => {
          const b = other.getBoundingClientRect();
          return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        });
      }),
    }));
    expect(layout.overflow).toBe(false);
    expect(layout.overlaps).toBe(false);

    await page.locator('#askJarvisAboutAnalysis').click();
    await expect(page.locator('.ask-page')).toBeVisible();
    await expect(page.locator('#jarvisQuestion')).toHaveValue(/EURUSD H4 preliminary analysis/);
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    test(`mobile analysis stays in viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('button', { name: 'AI Analysis' }).click();
      await expect(page.locator('.ai-analysis-page')).toBeVisible();
      await expect(page.locator('.analysis-module')).toHaveCount(13);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        maxCardWidth: Math.max(...[...document.querySelectorAll('.analysis-module')].map((card) => card.getBoundingClientRect().width)),
        viewport: document.documentElement.clientWidth,
      }));
      expect(state.overflow).toBe(false);
      expect(state.maxCardWidth).toBeLessThanOrEqual(state.viewport);
    });
  }
});
