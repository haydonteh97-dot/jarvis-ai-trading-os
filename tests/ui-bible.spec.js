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

async function openOpportunityScanner(page, mobile = false) {
	await page.route('**/api/scanner/run', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 550));
		const components = { trendAlignment: 20, marketStructure: 17, liquidityContext: 10, volatilitySuitability: 9, setupConfirmation: 10, riskRewardQuality: 0, macroRisk: 0, newsRisk: 0 };
		const makeResult = (asset, score, bias, setupType, alignment) => ({
			id: asset + '-test-scan', asset, symbol: asset, market: asset === 'XAUUSD' ? 'Gold' : 'Euro / US Dollar', category: asset === 'XAUUSD' ? 'Gold' : 'Forex',
			setupType, timeframe: 'H1', alignment, bias, risk: 'Moderate', macroRisk: 'Unavailable', newsRisk: 'Unavailable', marketMode: 'Pullback', trend: bias,
			confirmation: 'Waiting Confirmation', components: { ...components, trendAlignment: asset === 'XAUUSD' ? 20 : 15 }, score, band: score >= 75 ? 'High' : 'Medium',
			dataQuality: 'Verified', freshness: 'current', rr: 'Unavailable', hardReject: false, mainFactor: alignment + '; deterministic structure.',
			mainRisk: 'RR, Macro and News inputs are unavailable.', activeMetric: 'Scanner Result', analysisSource: 'Test verified candles · Deterministic Scanner v1',
			dataCompleteness: 'Verified', missingFactors: ['Risk/Reward', 'Macro', 'News', 'Execution levels'], dataQualityPenalty: 0,
		});
		const results = [makeResult('XAUUSD', 76, 'Bullish', 'Pullback', 'Fully Aligned'), makeResult('EURUSD', 61, 'Neutral', 'Range Break', 'Partially Aligned')];
		await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
			scanId: 'test-scan', status: 'completed', completedAt: '2026-07-14T00:00:00.000Z', dataQuality: 'Verified', results,
			counters: { requested: 2, completed: 2, partial: 0, unavailable: 0, validSetups: 2, rejectedSetups: 0 },
			marketOverview: { overallBias: 'Mixed', points: ['Dominant bias: Mixed.', 'Valid setups: 2; rejected setups: 0.', 'Macro and News risk sources are unavailable; both score 0/5.'] },
			distribution: { high: 1, medium: 1, low: 0, rejected: 0, totalValid: 2 }
		}, meta: {}, error: null }) });
	});
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Opportunity Scanner' }).click();
  await expect(page.locator('.s8-scanner-page')).toBeVisible();
	await page.locator('#runS8Scan').click();
	await expect(page.getByText('JARVIS is scanning supported markets...', { exact: true })).toBeHidden({ timeout: 5000 });
}

test.describe('Sprint 8 Opportunity Scanner', () => {
  test('desktop hierarchy, deterministic ranking and honest partial data render', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await openOpportunityScanner(page);
	await expect(page.locator('.s8-source-notice')).toContainText('Deterministic Scanner');
	await expect(page.locator('.s8-scan-status')).toContainText('Completed');
	await expect(page.locator('.s8-scan-status')).toContainText('Macro + News contribute 0 until connected');
    await expect(page.locator('.s8-summary article')).toHaveCount(6);
	await expect(page.locator('.s8-opportunity-row')).toHaveCount(2);
    await expect(page.locator('.s8-opportunity-row').first()).toContainText('XAUUSD');
	await expect(page.locator('.s8-opportunity-row').first()).toContainText('76/100');
    await expect(page.locator('.s8-setup-preview')).toContainText('Exact level unavailable');
    await expect(page.locator('.s8-score-breakdown')).toContainText('Penalties: RR 0/10, Macro 0/5, News 0/5');
    await expect(page.locator('.s8-confirmation')).toContainText('Macro window clear');
    await expect(page.locator('.s8-risk-context')).toContainText('Insufficient Data');
    const layout = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cardsFit: [...document.querySelectorAll('.s8-panel')].every((element) => element.getBoundingClientRect().right <= document.documentElement.clientWidth + 1),
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.cardsFit).toBe(true);
    await page.screenshot({ path: 'artifacts/scanner-desktop.png', fullPage: true });
    await page.locator('.s8-scan-status').screenshot({ path: 'artifacts/scanner-status.png' });
    await page.locator('.s8-summary').screenshot({ path: 'artifacts/scanner-summary.png' });
    await page.locator('.s8-top-opportunities').screenshot({ path: 'artifacts/scanner-top-opportunities.png' });
    await page.locator('.s8-heatmap').screenshot({ path: 'artifacts/scanner-heatmap.png' });
    await page.locator('.s8-setup-preview').screenshot({ path: 'artifacts/scanner-setup-preview.png' });
    await page.locator('.s8-score-breakdown').screenshot({ path: 'artifacts/scanner-score-breakdown.png' });
    await page.locator('.s8-confirmation').screenshot({ path: 'artifacts/scanner-confirmation-checklist.png' });
    await page.locator('.s8-risk-context').screenshot({ path: 'artifacts/scanner-risk-context.png' });
    await page.locator('.s8-source-notice').screenshot({ path: 'artifacts/scanner-disconnected-source.png' });
    await page.locator('.s8-scan-status').screenshot({ path: 'artifacts/scanner-partial-scan.png' });
  });

  test('advanced filters work and no-results state remains honest', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openOpportunityScanner(page);
    await page.locator('.s8-advanced summary').click();
    await page.locator('.s8-advanced').screenshot({ path: 'artifacts/scanner-advanced-filters.png' });
    await page.locator('#s8Asset').selectOption('EURUSD');
	await page.locator('#s8Timeframe').selectOption('H1');
    await page.locator('#s8Bias').selectOption('Neutral');
    await page.locator('#s8Band').selectOption('Medium');
    await page.locator('#s8SetupType').selectOption('Range Break');
	await page.locator('#s8Risk').selectOption('Moderate');
    await page.locator('#s8MacroRisk').selectOption('Unavailable');
    await page.locator('#s8NewsRisk').selectOption('Unavailable');
    await page.locator('#s8Alignment').selectOption('Partially Aligned');
    await page.locator('#applyS8Filters').click();
    await expect(page.locator('.s8-opportunity-row')).toHaveCount(1);
    await expect(page.locator('.s8-opportunity-row')).toContainText('EURUSD');
    await page.locator('.s8-advanced summary').click();
    await page.locator('#s8MinimumRR').selectOption('1:1 or higher');
    await page.locator('#applyS8Filters').click();
    await expect(page.locator('.s8-empty')).toContainText('No opportunities match the selected criteria.');
    await page.screenshot({ path: 'artifacts/scanner-no-results.png', fullPage: false });
    await page.locator('#emptyResetS8Filters').click();
	await expect(page.locator('.s8-opportunity-row')).toHaveCount(2);
    await page.locator('[data-s8-category="Crypto"]').click();
	await expect(page.locator('.s8-empty')).toContainText('No opportunities match the selected criteria.');
  });

  test('scan lifecycle prevents duplicates and preserves filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openOpportunityScanner(page);
    await page.locator('[data-s8-category="Gold"]').click();
    await page.locator('#runS8Scan').click();
    await expect(page.getByText('JARVIS is scanning supported markets...', { exact: true })).toBeVisible();
    await expect(page.locator('#runS8Scan')).toBeDisabled();
    await page.screenshot({ path: 'artifacts/scanner-loading.png', fullPage: false });
    await expect(page.getByText('JARVIS is scanning supported markets...', { exact: true })).toBeHidden({ timeout: 4000 });
    await expect(page.locator('[data-s8-category="Gold"]')).toHaveClass(/active/);
    await expect(page.locator('.s8-opportunity-row')).toHaveCount(1);
  });

  test('custom scan, settings and saved scan criteria work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openOpportunityScanner(page);
    await page.locator('.s8-custom-scan summary').click();
    await page.locator('.s8-custom-scan').screenshot({ path: 'artifacts/scanner-custom-scan.png' });
    await page.locator('#s8CustomWatchlist').check();
    await page.locator('#runS8CustomScan').click();
    await expect(page.locator('.s8-form-message').first()).toContainText('Watchlist integration unavailable');

    await page.locator('.s8-scan-settings summary').click();
    await page.locator('#s8HighThreshold').fill('80');
    await page.locator('#s8MediumThreshold').fill('55');
    await page.locator('#saveS8Settings').click();
    await expect(page.locator('.s8-summary')).toContainText('Score 80–100');

    await page.locator('.s8-saved-scans summary').click();
    await page.locator('#s8SaveName').fill('Gold Review');
    await page.locator('#saveS8Scan').click();
    await page.locator('.s8-saved-scans summary').click();
    await expect(page.locator('.s8-saved-list')).toContainText('Gold Review');
    await page.locator('.s8-saved-scans').screenshot({ path: 'artifacts/scanner-saved-scans.png' });

    await page.locator('[data-s8-category="Crypto"]').click();
    await page.locator('.s8-saved-scans summary').click();
    await page.locator('[data-s8-load-scan]').first().click();
    await expect(page.locator('[data-s8-category="All Markets"]')).toHaveClass(/active/);

    page.once('dialog', (dialog) => dialog.accept('Renamed Review'));
    await page.locator('.s8-saved-scans summary').click();
    await page.locator('[data-s8-rename-scan]').first().click();
    await page.locator('.s8-saved-scans summary').click();
    await expect(page.locator('.s8-saved-list')).toContainText('Renamed Review');

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('[data-s8-delete-scan]').first().click();
    await expect(page.locator('.s8-saved-list')).toHaveCount(0);
  });

  test('opportunity selection and both contextual handoffs work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openOpportunityScanner(page);
	await page.locator('[data-s8-opportunity="EURUSD-test-scan"]').first().click();
    await expect(page.locator('.s8-setup-preview')).toContainText('EURUSD');
	await expect(page.locator('.s8-score-breakdown')).toContainText('61/100');
    await page.locator('#askJarvisAboutS8').click();
    await expect(page.locator('.ask-page')).toBeVisible();
	await expect(page.locator('#jarvisQuestion')).toHaveValue(/EURUSD H1 deterministic scanner setup/);

    await page.getByRole('button', { name: 'Opportunity Scanner' }).click();
	await page.locator('[data-s8-opportunity="XAUUSD-test-scan"]').first().click();
    await page.locator('#openS8InAnalysis').click();
    await expect(page.locator('.ai-analysis-page')).toBeVisible();
    await expect(page.locator('#analysisAssetSelect')).toHaveValue('XAUUSD');
    await expect(page.locator('#analysisTimeframeSelect')).toHaveValue('H1');
  });

  test('scan failure and retry preserve scanner state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openOpportunityScanner(page);
    await page.locator('[data-s8-category="Forex"]').click();
	await page.unroute('**/api/scanner/run');
	await page.route('**/api/scanner/run', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, meta: {}, error: { code: 'SCANNER_FAILED', message: 'Scanner data is temporarily unavailable.' } }) }));
	await page.locator('#runS8Scan').click();
    await expect(page.locator('.s8-error')).toContainText('could not be completed');
    await page.screenshot({ path: 'artifacts/scanner-failure.png', fullPage: false });
	await page.unroute('**/api/scanner/run');
	await page.route('**/api/scanner/run', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, meta: {}, error: { code: 'SCANNER_FAILED', message: 'Scanner data is temporarily unavailable.' } }) }));
	await page.locator('#retryS8Scan').click();
	await expect(page.getByText('JARVIS is scanning supported markets...', { exact: true })).toBeVisible();
	await expect(page.getByText('JARVIS is scanning supported markets...', { exact: true })).toBeHidden({ timeout: 5000 });
    await expect(page.locator('[data-s8-category="Forex"]')).toHaveClass(/active/);
	await expect(page.locator('.s8-error')).toHaveCount(1);
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    test('mobile scanner stays inside viewport at ' + viewport.width + 'x' + viewport.height, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await openOpportunityScanner(page, true);
	await expect(page.locator('.s8-opportunity-row')).toHaveCount(2);
      await expect(page.locator('.s8-setup-preview')).toContainText('Exact level unavailable');
      const mobile = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        maxPanelWidth: Math.max(...[...document.querySelectorAll('.s8-panel, .s8-opportunity-row')].map((element) => element.getBoundingClientRect().width)),
      }));
      expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
      expect(mobile.maxPanelWidth).toBeLessThanOrEqual(mobile.width);
      if (viewport.width === 390) await page.screenshot({ path: 'artifacts/scanner-mobile.png', fullPage: true });
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

async function openNewsEvents(page, mobile = false) {
  if (mobile) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'News & Events' }).click();
  await expect(page.locator('.s7-news-page')).toBeVisible();
}

test.describe('Sprint 7 News & Events Intelligence', () => {
  test('desktop intelligence hierarchy is complete and data honesty is explicit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await openNewsEvents(page);

    await expect(page.getByText('Live news source not connected.', { exact: true })).toBeVisible();
    await expect(page.locator('.s7-head-actions')).toContainText('News Source Not Connected');
    await expect(page.locator('.s7-top-story')).toHaveCount(3);
    await expect(page.locator('.s7-breaking')).toContainText('No verified breaking news at this time.');
    await expect(page.locator('.s7-latest-story')).toHaveCount(2);
    await expect(page.locator('.verification-demo').first()).toBeVisible();
    expect(await page.locator('.s7-story-card').evaluateAll((cards) => cards.every((card) => card.textContent.includes('Demo')))).toBe(true);
    await expect(page.getByText('Published time unavailable', { exact: true }).first()).toBeVisible();
    await expect(page.locator('.s7-timeline')).toContainText('No verified event timeline available.');
    await page.screenshot({ path: 'artifacts/news-desktop.png', fullPage: true });
    await page.locator('.s7-top-stories').screenshot({ path: 'artifacts/news-top-stories.png' });
    await page.locator('.s7-breaking').screenshot({ path: 'artifacts/news-breaking-state.png' });
    await page.locator('.s7-selected-detail').screenshot({ path: 'artifacts/news-selected-detail.png' });
    await page.locator('.s7-ai-summary').screenshot({ path: 'artifacts/news-ai-summary.png' });
    await page.locator('.s7-interpretation').screenshot({ path: 'artifacts/news-interpretation.png' });
    await page.locator('.s7-market-impact').screenshot({ path: 'artifacts/news-market-impact.png' });
    await page.locator('.s7-affected-assets').screenshot({ path: 'artifacts/news-affected-assets.png' });
    await page.locator('.s7-sentiment').screenshot({ path: 'artifacts/news-market-sentiment.png' });
    await page.locator('.s7-risk').screenshot({ path: 'artifacts/news-risk-context.png' });
    await page.locator('.s7-timeline').screenshot({ path: 'artifacts/news-timeline.png' });
    await page.locator('.s7-source-notice').screenshot({ path: 'artifacts/news-disconnected-source.png' });
  });

  test('category, impact, time and reset filters work without duplicate stories', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openNewsEvents(page);

    await page.locator('[data-news-category="Crypto"]').click();
    await expect(page.locator('.s7-story-card')).toHaveCount(1);
    await expect(page.getByText('Demo Scenario: Regulatory Update Changes Crypto Risk Perception', { exact: true }).first()).toBeVisible();
    await page.locator('#newsImpactFilter').selectOption('High');
    await expect(page.getByText('No news matches the selected filters.', { exact: true })).toBeVisible();
    await expect(page.locator('.s7-empty')).toContainText('Live news source not connected.');

    await page.locator('#emptyResetNewsFilters').click();
    await page.locator('#newsTimeFilter').selectOption('Today');
    await expect(page.getByText('No news matches the selected filters.', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/news-empty-filter-state.png', fullPage: false });
    await page.locator('#emptyResetNewsFilters').click();
    const ids = await page.locator('.s7-story-card').evaluateAll((cards) => cards.map((card) => card.dataset.newsStory));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('story selection, related news and both contextual handoffs work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openNewsEvents(page);
    await page.locator('[data-news-story="demo-energy-supply"]').first().click();
    await expect(page.locator('.s7-selected-detail')).toContainText('Demo Scenario: Energy Supply Concern Increases Oil Sensitivity');
    await expect(page.locator('.s7-related')).toContainText('Demo Scenario: Geopolitical Risk Raises Defensive-Market Sensitivity');

    await page.locator('#askJarvisAboutNews').click();
    await expect(page.locator('.ask-page')).toBeVisible();
    await expect(page.locator('#jarvisQuestion')).toHaveValue(/Demo Scenario: Energy Supply Concern/);

    await page.getByRole('button', { name: 'News & Events' }).click();
    await page.locator('[data-news-story="demo-policy-guidance"]').first().click();
    await page.locator('#openNewsInAnalysis').click();
    await expect(page.locator('.ai-analysis-page')).toBeVisible();
    await expect(page.locator('#analysisAssetSelect')).toHaveValue('XAUUSD');
  });

  test('refresh prevents duplicate actions and preserves filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openNewsEvents(page);
    await page.locator('[data-news-category="Gold"]').click();
    const refresh = page.locator('#refreshNewsData');
    await refresh.click();
    await expect(page.getByText('JARVIS is updating market news...', { exact: true })).toBeVisible();
    await expect(refresh).toBeDisabled();
    await page.screenshot({ path: 'artifacts/news-loading-state.png', fullPage: false });
    await expect(page.getByText('JARVIS is updating market news...', { exact: true })).toBeHidden({ timeout: 4000 });
    await expect(page.locator('[data-news-category="Gold"]')).toHaveClass(/active/);
  });

  test('source error and retry preserve selected filters', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('jarvis-news-source-error', '1'));
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await openNewsEvents(page);
    await page.locator('#newsImpactFilter').selectOption('Medium');
    await expect(page.getByText('Market news is temporarily unavailable.', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'artifacts/news-error-state.png', fullPage: false });
    await page.locator('#retryNewsUpdate').click();
    await expect(page.getByText('JARVIS is updating market news...', { exact: true })).toBeVisible();
    await expect(page.getByText('JARVIS is updating market news...', { exact: true })).toBeHidden({ timeout: 4000 });
    await expect(page.locator('#newsImpactFilter')).toHaveValue('Medium');
    await expect(page.getByText('Market news is temporarily unavailable.', { exact: true })).toHaveCount(0);
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    test(`mobile news stays in viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await openNewsEvents(page, true);
      await expect(page.locator('.s7-story-card')).toHaveCount(5);
      const mobile = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        maxCardWidth: Math.max(...[...document.querySelectorAll('.s7-panel, .s7-story-card')].map((element) => element.getBoundingClientRect().width)),
        timezone: document.querySelector('.s7-data-status')?.textContent.includes('Timezone:'),
      }));
      expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
      expect(mobile.maxCardWidth).toBeLessThanOrEqual(mobile.width);
      expect(mobile.timezone).toBe(true);
      if (viewport.width === 390) await page.screenshot({ path: 'artifacts/news-mobile.png', fullPage: true });
    });
  }
});
