const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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

async function openUploadChart(page, mobile = false) {
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Upload Chart' }).click();
  await expect(page.locator('.upload-chart-page')).toBeVisible();
}

const validPngPath = path.resolve(__dirname, '..', 'assets', 'earth-horizon-master.png');
const validJpegBuffer = fs.readFileSync(path.resolve(__dirname, '..', 'assets', 'apex-logo-official.jpg'));
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7xkAAAAASUVORK5CYII=', 'base64');

test.describe('Sprint 5 Upload Chart', () => {
  test('validates files and completes an honest chart workflow on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await openUploadChart(page);
    await expect(page.getByText('Upload a chart to begin visual analysis.', { exact: true })).toBeVisible();
    await expect(page.locator('.s5-analysis-grid')).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'artifacts/upload-chart-desktop-empty.png', fullPage: false });

    const input = page.locator('#chartUploadInput');
    await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a chart') });
    await expect(page.getByText('Upload a PNG, JPG, JPEG or WEBP image.', { exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'artifacts/upload-chart-invalid-file.png', fullPage: false });

    await input.setInputFiles({ name: 'tiny-chart.png', mimeType: 'image/png', buffer: onePixelPng });
    await expect(page.getByText('JARVIS could not read enough chart information. Upload a clearer image.', { exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'artifacts/upload-chart-unreadable.png', fullPage: false });

    await input.setInputFiles(validPngPath);
    await expect(page.locator('.s5-chart-preview img')).toBeVisible();
    await expect(page.locator('#analyzeChartButton')).toBeEnabled();
    expect(await page.locator('.s5-chart-preview img').evaluate((image) => getComputedStyle(image).objectFit)).toBe('contain');
    await page.locator('#chartAssetSelect').selectOption('XAUUSD');
    await page.locator('#chartTimeframeSelect').selectOption('H1');
    await page.locator('#chartFocusInput').fill('Review visible structure and explain what cannot be verified.');
    await expect(page.locator('#chartFocusCount')).toHaveText(/60\/300|61\/300|62\/300/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'artifacts/upload-chart-desktop-preview.png', fullPage: false });

    await page.locator('#zoomChartButton').click();
    await expect(page.locator('.s5-preview-modal')).toBeVisible();
    await page.locator('#closeChartPreview').click();
    await expect(page.locator('.s5-preview-modal')).toHaveCount(0);

    await page.locator('#analyzeChartButton').click();
    await expect(page.getByText('JARVIS is analysing your chart...', { exact: true })).toBeVisible();
    await expect(page.locator('#analyzeChartButton')).toBeDisabled();
    await page.screenshot({ path: 'artifacts/upload-chart-analysing.png', fullPage: false });
    await expect(page.getByText('Analysis checks complete', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.s5-analysis-grid .s5-module')).toHaveCount(13);
    await expect(page.getByText('Exact Price Unavailable', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Chart vision not connected', { exact: true })).toBeVisible();
    await expect(page.getByText('External Verification Required', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/upload-chart-desktop-complete.png', fullPage: true });

    await page.locator('#openChartInAiAnalysis').click();
    await expect(page.locator('.ai-analysis-page')).toBeVisible();
    await expect(page.locator('#analysisAssetSelect')).toHaveValue('XAUUSD');
    await expect(page.locator('#analysisTimeframeSelect')).toHaveValue('H1');
  });

  test('accepts supported image formats and rejects oversized or corrupt files', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openUploadChart(page);
    const input = page.locator('#chartUploadInput');
    const webpDataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext('2d');
      context.fillStyle = '#06111b';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#78d7ef';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(20, 280);
      context.lineTo(150, 190);
      context.lineTo(290, 230);
      context.lineTo(450, 110);
      context.lineTo(620, 150);
      context.stroke();
      return canvas.toDataURL('image/webp', 0.9);
    });
    const validWebpBuffer = Buffer.from(webpDataUrl.split(',')[1], 'base64');
    const supported = [
      { name: 'chart.png', mimeType: 'image/png', buffer: fs.readFileSync(validPngPath) },
      { name: 'chart.jpg', mimeType: 'image/jpeg', buffer: validJpegBuffer },
      { name: 'chart.jpeg', mimeType: 'image/jpeg', buffer: validJpegBuffer },
      { name: 'chart.webp', mimeType: 'image/webp', buffer: validWebpBuffer },
    ];
    for (const file of supported) {
      await input.setInputFiles(file);
      await expect(page.locator('.s5-chart-preview img'), file.name).toBeVisible();
      await page.locator('#removeChartButton').click();
      await expect(page.locator('.s5-chart-preview')).toHaveCount(0);
    }

    await input.setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
    await expect(page.getByText('The selected image exceeds the supported file size.', { exact: true })).toBeVisible();
    await input.setInputFiles({ name: 'corrupt.png', mimeType: 'image/png', buffer: Buffer.from('corrupt-image') });
    await expect(page.getByText('The selected image is corrupt or unreadable.', { exact: true })).toBeVisible();
  });

  test('preserves chart context when handing off to Ask JARVIS', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openUploadChart(page);
    await page.locator('#chartUploadInput').setInputFiles(validPngPath);
    await page.locator('#chartAssetSelect').selectOption('BTCUSD');
    await page.locator('#chartTimeframeSelect').selectOption('M15');
    await page.locator('#analyzeChartButton').click();
    await expect(page.getByText('Analysis checks complete', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.locator('#askJarvisAboutChart').click();
    await expect(page.locator('.ask-page')).toBeVisible();
    await expect(page.locator('#jarvisQuestion')).toHaveValue(/BTCUSD M15 chart/);
  });

  test('mobile upload, preview and completed state have no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await openUploadChart(page, true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'artifacts/upload-chart-mobile-empty.png', fullPage: false });
    await page.locator('#chartUploadInput').setInputFiles(validPngPath);
    await expect(page.locator('.s5-chart-preview img')).toBeVisible();
    await page.locator('#chartAssetSelect').selectOption('XAUUSD');
    await page.locator('#chartTimeframeSelect').selectOption('H1');
    await page.screenshot({ path: 'artifacts/upload-chart-mobile-preview.png', fullPage: false });
    await page.locator('#analyzeChartButton').click();
    await expect(page.getByText('Analysis checks complete', { exact: true })).toBeVisible({ timeout: 5000 });
    const mobile = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      previewWidth: document.querySelector('.s5-chart-preview')?.getBoundingClientRect().width,
    }));
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
    expect(mobile.previewWidth).toBeLessThanOrEqual(mobile.width);
    await page.screenshot({ path: 'artifacts/upload-chart-mobile-complete.png', fullPage: true });
  });

  test('430px mobile layout stays inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await login(page);
    await openUploadChart(page, true);
    await page.locator('#chartUploadInput').setInputFiles(validPngPath);
    await page.locator('#chartAssetSelect').selectOption('EURUSD');
    await page.locator('#chartTimeframeSelect').selectOption('M15');
    await page.locator('#analyzeChartButton').click();
    await expect(page.getByText('Analysis checks complete', { exact: true })).toBeVisible({ timeout: 5000 });
    const mobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
  });
});

async function openMacroIntelligence(page, mobile = false) {
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Macro Intelligence' }).click();
  await expect(page.locator('.s6-macro-page')).toBeVisible();
}

test.describe('Sprint 6 Macro Intelligence', () => {
  test('desktop calendar, filters, selection, refresh and honest data status', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await openMacroIntelligence(page);

    await expect(page.getByText('Verified macro source not connected.', { exact: true })).toBeVisible();
    await expect(page.locator('.s6-head-actions')).toContainText('Data Source Not Connected');
    await expect(page.locator('.quality-demo').first()).toBeVisible();
    await expect(page.locator('.s6-event-card')).toHaveCount(2);
    await expect(page.locator('.release-released')).toHaveCount(1);
    await expect(page.locator('.release-upcoming')).toHaveCount(1);
    await expect(page.getByText('3.1% (Demo)', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('3.2% (Demo)', { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: 'artifacts/macro-desktop.png', fullPage: true });

    await page.locator('#macroImpact').selectOption('High');
    await page.locator('#macroCurrency').selectOption('USD');
    await page.locator('#macroCategory').selectOption('Employment');
    await expect(page.locator('.s6-event-card')).toHaveCount(1);
    await expect(page.getByText('Sample Employment Report', { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: 'artifacts/macro-filter-controls.png', fullPage: false });

    await page.locator('#resetMacroFilters').click();
    await expect(page.locator('#macroImpact')).toHaveValue('All');
    await expect(page.locator('#macroCurrency')).toHaveValue('All');
    await expect(page.locator('#macroCategory')).toHaveValue('All');
    await page.locator('[data-macro-event="demo-us-employment-upcoming"]').click();
    await expect(page.locator('.s6-event-detail')).toContainText('Sample Employment Report');
    await expect(page.locator('.s6-interpretation')).toContainText('Data Unavailable');
    await page.screenshot({ path: 'artifacts/macro-selected-event-detail.png', fullPage: true });

    await page.locator('[data-macro-event="demo-us-inflation-released"]').click();
    await expect(page.locator('.s6-interpretation')).toContainText('Weaker Than Expected');
    await expect(page.locator('.s6-interpretation')).toContainText('-0.1 pp (Demo)');
    await page.screenshot({ path: 'artifacts/macro-released-interpretation.png', fullPage: true });

    const refresh = page.locator('#refreshMacroData');
    await refresh.click();
    await expect(page.getByText('JARVIS is updating macro intelligence...', { exact: true })).toBeVisible();
    await expect(page.locator('#refreshMacroData')).toBeDisabled();
    await page.screenshot({ path: 'artifacts/macro-loading-state.png', fullPage: false });
    await expect(page.getByText('JARVIS is updating macro intelligence...', { exact: true })).toBeHidden({ timeout: 4000 });
    await expect(page.locator('#macroDateRange')).toHaveValue('Today');
  });

  test('date filter, empty state and reset work without invented records', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openMacroIntelligence(page);
    await page.locator('#macroDateRange').selectOption('Tomorrow');
    await expect(page.locator('.s6-event-card')).toHaveCount(1);
    await expect(page.getByText('Sample Growth Survey', { exact: true }).first()).toBeVisible();
    await page.locator('#macroCurrency').selectOption('GBP');
    await expect(page.getByText('No macro events match the selected filters.', { exact: true })).toBeVisible();
    await expect(page.locator('.s6-empty')).toContainText('Verified macro source not connected.');
    await page.screenshot({ path: 'artifacts/macro-empty-filter-state.png', fullPage: false });
    await page.locator('#emptyResetMacroFilters').click();
    await expect(page.locator('.s6-event-card')).toHaveCount(2);
  });

  test('disconnected error state and retry preserve filters', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('jarvis-macro-source-error', '1'));
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openMacroIntelligence(page);
    await page.locator('#macroImpact').selectOption('High');
    await expect(page.getByText('Macro data is temporarily unavailable.', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/macro-disconnected-state.png', fullPage: false });
    await page.locator('#retryMacroData').click();
    await expect(page.getByText('JARVIS is updating macro intelligence...', { exact: true })).toBeVisible();
    await expect(page.getByText('JARVIS is updating macro intelligence...', { exact: true })).toBeHidden({ timeout: 4000 });
    await expect(page.locator('#macroImpact')).toHaveValue('High');
    await expect(page.getByText('Macro data is temporarily unavailable.', { exact: true })).toHaveCount(0);
  });

  test('contextual handoffs preserve selected macro context', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openMacroIntelligence(page);
    await page.locator('[data-macro-event="demo-us-inflation-released"]').click();
    await page.locator('#askJarvisAboutMacro').click();
    await expect(page.locator('.ask-page')).toBeVisible();
    await expect(page.locator('#jarvisQuestion')).toHaveValue(/Sample Core Inflation Release demo context/);

    await page.getByRole('button', { name: 'Macro Intelligence' }).click();
    await page.locator('#openMacroInAnalysis').click();
    await expect(page.locator('.ai-analysis-page')).toBeVisible();
    await expect(page.locator('#analysisAssetSelect')).toHaveValue('XAUUSD');
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    test(`mobile macro stays in viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await openMacroIntelligence(page, true);
      await expect(page.locator('.s6-event-card')).toHaveCount(2);
      const mobile = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        maxCardWidth: Math.max(...[...document.querySelectorAll('.s6-module, .s6-event-card')].map((element) => element.getBoundingClientRect().width)),
        timezone: document.querySelector('.s6-risk-summary')?.textContent.includes('Timezone:'),
      }));
      expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
      expect(mobile.maxCardWidth).toBeLessThanOrEqual(mobile.width);
      expect(mobile.timezone).toBe(true);
      if (viewport.width === 390) await page.screenshot({ path: 'artifacts/macro-mobile.png', fullPage: true });
    });
  }
});
