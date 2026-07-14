const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
  if (await page.locator('.login-form').count()) {
    await page.locator('#accessInput').fill('apex');
    await page.locator('.login-form button[type="submit"]').click();
  }
  if ((page.viewportSize()?.width || 1440) <= 900) await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Ask JARVIS' }).click();
}

function responseFor(body) {
  const zh = /[\u3400-\u9fff]/.test(body.message);
  return { success: true, data: { conversationId: body.conversationId || 'conv_ui_test', messageId: 'msg_ui_test', language: zh ? 'zh' : 'en', intent: ['market_status'], status: 'completed', answer: { headline: zh ? '资料状态 — 需要确认' : 'Data Status — Confirmation Required', summary: zh ? 'XAUUSD 当前资料为 Demo，仍需验证。' : 'XAUUSD context is Demo and still requires verification.', marketBias: null, decisionStatus: 'Data Required', mainFactors: ['market.getQuote: demo'], mainRisks: ['Live market source unavailable'], nextConfirmation: zh ? '等待已验证资料。' : 'Wait for verified data.', riskWarning: zh ? '最终决定由你作出。' : 'The final decision remains with you.' }, toolResults: [{ success: true, tool: 'market.getQuote', data: { symbol: 'XAUUSD' }, meta: { source: 'MockMarketDataProvider', dataStatus: 'demo', freshness: 'unavailable', timestamp: null, cached: false }, error: null }], dataQuality: 'demo', sources: [{ tool: 'market.getQuote', source: 'MockMarketDataProvider', timestamp: null, dataStatus: 'demo', freshness: 'unavailable' }], missingData: [], followUpOptions: ['Open AI Analysis'], createdAt: '2024-01-15T00:00:00Z' }, meta: { provider: 'MockAIModelProvider', dataStatus: 'demo' }, error: null };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/jarvis/message', async (route) => { const body = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor(body)) }); });
});

test('Ask JARVIS uses internal route and renders structured Demo response', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await login(page);
  await page.locator('#jarvisQuestion').fill('What is XAUUSD price?'); await page.locator('.ask-page .jarvis-question-form').dispatchEvent('submit');
  await expect(page.locator('.jarvis-thinking-response')).toBeVisible();
  await expect(page.locator('.jarvis-market-brief')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.mentor-answer')).toContainText('Demo');
  await expect(page.locator('.jarvis-market-brief')).toContainText('Unavailable');
});

test('conversation ID continues and Chinese response stays Chinese', async ({ page }) => {
  const ids = []; await page.unroute('**/api/jarvis/message'); await page.route('**/api/jarvis/message', async (route) => { const body = route.request().postDataJSON(); ids.push(body.conversationId); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor(body)) }); });
  await page.setViewportSize({ width: 390, height: 844 }); await login(page);
  await page.locator('#jarvisQuestion').fill('黄金 XAUUSD 现在价格？'); await page.locator('.ask-page .jarvis-question-form').dispatchEvent('submit'); await expect(page.locator('.mentor-answer')).toContainText('仍需验证', { timeout: 5000 });
  await page.locator('#jarvisQuestion').fill('为什么？'); await page.locator('.ask-page .jarvis-question-form').dispatchEvent('submit'); await expect.poll(() => ids.length).toBe(2);
  expect(ids[1]).toBe('conv_ui_test');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflow).toBe(false);
});

test('Live OpenAI error is shown honestly without Demo fallback', async ({ page }) => {
  await page.unroute('**/api/jarvis/message');
  await page.route('**/api/jarvis/message', (route) => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, meta: { provider: 'OpenAI', dataStatus: 'unavailable' }, error: { code: 'AI_RATE_LIMITED', message: 'JARVIS is temporarily rate limited.' } }) }));
  await page.setViewportSize({ width: 1440, height: 900 }); await login(page);
  await page.locator('#jarvisQuestion').fill('What is XAUUSD price?'); await page.locator('.ask-page .jarvis-question-form').dispatchEvent('submit');
  await expect(page.locator('.mentor-answer')).toContainText('quota limit', { timeout: 5000 });
  await expect(page.locator('.mentor-answer')).not.toContainText('Demo');
});
