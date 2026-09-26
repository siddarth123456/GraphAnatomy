import { expect, test, type Page } from '@playwright/test';
import { anatomyPixels } from './anatomy-pixels';

// Loading the expanded atlas and reading WebGL pixels can be slow on software GPUs.
test.setTimeout(90_000);
const rendered = { timeout: 30_000 };

async function select(page: Page, name: string) {
  const search = page.getByRole('combobox', { name: 'Search anatomy' });
  await search.fill(name);
  await search.press('Enter');
  await expect(page.getByTestId('metadata-panel').getByRole('heading', { name, exact: true })).toBeVisible();
  await page.mouse.move(10, 10);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  // Exclude DOM labels from pixel evidence: only real geometry should satisfy it.
  await page.addStyleTag({ content: '.anatomy-label { visibility: hidden !important; }' });
});

test('median starter and ulnar nerve render real geometry and retain source attribution', async ({ page }) => {
  await page.getByRole('button', { name: 'Nerves & vessels', exact: true }).click();
  await page.getByRole('button', { name: 'Median Nerve Explore in 3D', exact: true }).click();
  const panel = page.getByTestId('metadata-panel');
  await expect(panel.getByRole('heading', { name: 'Right median nerve', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(300);
  await panel.getByText('3D source and license', { exact: true }).click();
  await expect(panel.getByRole('link', { name: 'Geometry license', exact: true })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
  await expect(panel.getByRole('link', { name: 'Original geometry', exact: true })).toHaveAttribute('href', /6c7f9016bd5899ac8edafd31b9900c151df42ed6/);
  await select(page, 'Right ulnar nerve');
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(300);
  await page.getByRole('checkbox', { name: 'Cross section' }).check();
  await page.getByRole('slider', { name: 'Section position' }).focus();
  await page.keyboard.press('Home');
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeLessThan(20);
});

test('surface and grouped nail geometry render and remain framed on mobile', async ({ page }) => {
  await page.getByRole('button', { name: 'Surface', exact: true }).click();
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(5_000);
  await select(page, 'Right nail plates of hand (group)');
  await expect(page.getByTestId('metadata-panel').getByText(/not independently segmented by digit/)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Surface', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => {
    const frame = await anatomyPixels(page);
    return frame.count > 5_000 && frame.minX > 5 && frame.maxX < frame.width - 5
      && frame.minY > frame.top && frame.maxY < frame.bottom;
  }, rendered).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('source ligament surfaces and fascia are selectable without hiding representation limits', async ({ page }) => {
  await select(page, 'Right scapholunate interosseous ligament');
  await expect(page.getByTestId('metadata-panel').getByText(/Anatomical thickness is not modeled/)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(50);
  await select(page, 'Right palmar aponeurosis');
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(1_000);
});

test('a graph-only lumbrical links to its source group without receiving a duplicate mesh', async ({ page }) => {
  await select(page, 'Right lumbrical 1 of hand');
  const panel = page.getByTestId('metadata-panel');
  await expect(panel.getByText('Graph entry · No 3D model', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Isolate selected structure' })).toBeDisabled();
  const membership = panel.locator('.relation-card').filter({ hasText: 'part of' });
  await membership.getByRole('button', { name: 'Right lumbricals', exact: true }).click();
  await expect(panel.getByText('Selected in 3D', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect.poll(async () => (await anatomyPixels(page)).count, rendered).toBeGreaterThan(300);
});
