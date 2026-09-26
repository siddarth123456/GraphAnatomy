import { test, expect } from '@playwright/test';
import { anatomyPixels } from './anatomy-pixels';

test('search, graph and cited evidence complete the hand demo journey', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByText('Loading 3D models…')).toHaveCount(0);
  const search = page.getByRole('combobox', { name: 'Search anatomy' });
  await search.fill('scaphoid');
  await expect(page.getByRole('option', { name: /Scaphoid/ })).toBeVisible();
  await search.press('Enter');
  await expect(page.getByTestId('metadata-panel').getByRole('heading', { name: 'Scaphoid', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Isolate selected structure' })).toBeEnabled();
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect(page.getByRole('checkbox', { name: 'Isolate selected structure' })).toBeChecked();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  await page.getByRole('button', { name: 'Knowledge graph', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'See the connections.' })).toBeVisible();
  await page.getByLabel('Find a graph node').fill('median');
  await page.getByRole('button', { name: /^(Right )?Median Nerve 3D$/i }).click();
  await expect(page.getByTestId('metadata-panel').getByRole('heading', { name: /^(Right )?Median Nerve$/i })).toBeVisible();
  await expect(page.getByTestId('metadata-panel').getByText('Selected in 3D', { exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Find evidence' }).click();
  await page.getByRole('button', { name: 'What innervates abductor pollicis brevis?', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 evidence connection', exact: true })).toBeVisible();
  const card = page.locator('.evidence-panel .relation-card');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('button', { name: 'Abductor Pollicis Brevis', exact: true })).toBeVisible();
  await expect(card.getByRole('link')).toHaveAttribute('href', /kenhub.com/);
  await card.getByRole('button', { name: 'Abductor Pollicis Brevis', exact: true }).click();
  await expect(page.getByTestId('metadata-panel').getByRole('heading', { name: 'Abductor Pollicis Brevis', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'What structures are affected in carpal tunnel syndrome?', exact: true }).click();
  await expect(page.locator('.evidence-panel .relation-card').getByRole('button', { name: 'Carpal Tunnel Syndrome', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('empty search and unsupported questions are explicit, mobile controls remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Search anatomy' }).fill('does-not-exist');
  await expect(page.getByText(/No structures match/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Search anatomy' }).press('Escape');
  await page.getByRole('button', { name: 'Open controls', exact: true }).click();
  await page.getByRole('button', { name: 'Skeleton', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Skeleton', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close controls', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Find evidence' }).click();
  await page.getByLabel('Your anatomy question').fill('What is near the scaphoid?');
  await page.locator('form').getByRole('button', { name: 'Find evidence', exact: true }).click();
  await expect(page.getByText(/Spatial retrieval is not implemented/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('catalog failures display a retry path without inventing a fallback graph', async ({ page }) => {
  let unavailable = true;
  await page.route('**/api/anatomy', async (route) => {
    if (unavailable) await route.fulfill({ status: 503, body: '{"error":"unavailable"}', contentType: 'application/json' });
    else await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Knowledge catalog unavailable' })).toBeVisible();
  unavailable = false;
  await page.getByRole('button', { name: 'Retry catalog' }).click();
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
});

test('the bundled demo loads models and retrieves evidence with external network blocked', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await route.continue();
    else { external.push(url.hostname); await route.abort(); }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect.poll(async () => (await anatomyPixels(page)).count, { timeout: 30_000 }).toBeGreaterThan(5_000);
  await expect(page.getByText('Loading 3D models…')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: 'Find evidence' }).click();
  await page.getByRole('button', { name: 'What innervates abductor pollicis brevis?', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 evidence connection' })).toBeVisible();
  expect(external).toEqual([]);
});
