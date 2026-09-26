import { expect, test, type Page } from '@playwright/test';

/** Inspect the browser's rendered pixels, including WebGL, rather than store state. */
async function anatomyPixels(page: Page) {
  const canvas = page.locator('canvas').first();
  const screenshot = await canvas.screenshot();
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const scratch = document.createElement('canvas');
    scratch.width = image.width;
    scratch.height = image.height;
    const context = scratch.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, image.width, image.height);
    const mobile = image.width < 600;
    // Exclude the floating search controls and footer, which are not anatomy.
    const top = mobile ? 50 : 70;
    const bottom = image.height - (mobile ? 42 : 60);
    let count = 0;
    let minX = image.width, minY = image.height, maxX = -1, maxY = -1;
    for (let y = top; y < bottom; y++) {
      for (let x = 0; x < image.width; x++) {
        const i = (y * image.width + x) * 4;
        if (data[i] > 80 || data[i + 1] > 80 || data[i + 2] > 90) {
          count++;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
    return { count, minX, minY, maxX, maxY, width: image.width, height: image.height, top, bottom };
  }, screenshot.toString('base64'));
}

async function openViewer(page: Page) {
  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible();
  // Suspense can mount after the canvas; a hidden loading label alone is insufficient.
  await expect.poll(async () => (await anatomyPixels(page)).count).toBeGreaterThan(5_000);
  await expect(page.getByText('Loading 3D models…')).toHaveCount(0);
  await page.mouse.move(10, 10);
}

async function reset(page: Page) {
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
  await page.mouse.move(10, 10);
}

test('canvas raycast selection, isolation, explosion and reset change the rendered anatomy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openViewer(page);
  const initial = await anatomyPixels(page);
  const box = (await page.locator('canvas').first().boundingBox())!;
  // The visible radius shaft in the default palmar view, not a DOM/search shortcut.
  await page.mouse.click(box.x + box.width * 0.479, box.y + box.height * 0.557);
  await expect(page.getByTestId('metadata-panel').getByRole('heading', { name: 'Right Radius', exact: true })).toBeVisible();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(900); // CameraControls eases to the selected structure.
  const selected = await anatomyPixels(page);
  await page.getByRole('checkbox', { name: 'Isolate selected structure' }).check();
  await expect.poll(async () => (await anatomyPixels(page)).count).toBeLessThan(selected.count * 0.8);
  await expect.poll(async () => (await anatomyPixels(page)).count).toBeGreaterThan(5_000);
  await reset(page);
  await expect.poll(async () => Math.abs((await anatomyPixels(page)).count - initial.count)).toBeLessThan(100);
  await page.getByRole('slider', { name: 'Exploded view', exact: true }).focus();
  await page.keyboard.press('End');
  await page.mouse.move(10, 10);
  await expect.poll(async () => {
    const frame = await anatomyPixels(page);
    return frame.maxX - frame.minX;
  }).toBeGreaterThan((initial.maxX - initial.minX) * 1.5);
  await reset(page);
  await expect.poll(async () => Math.abs((await anatomyPixels(page)).count - initial.count)).toBeLessThan(100);
  expect(errors).toEqual([]);
});

// Give each plane its own test budget: screenshot readback is slow on CI's
// software GPU, and all three checks together can exceed the per-test deadline.
for (const plane of ['axial', 'sagittal', 'coronal']) {
test(`${plane} cross-section clips actual pixels at both limits and its midpoint`, async ({ page }) => {
  await openViewer(page);
  const initial = await anatomyPixels(page);
  await page.getByRole('checkbox', { name: 'Cross section' }).check();
    await page.getByRole('combobox', { name: 'Section plane' }).selectOption(plane);
    const slider = page.getByRole('slider', { name: 'Section position' });
    await slider.focus();
    await page.keyboard.press('Home');
    await expect.poll(async () => (await anatomyPixels(page)).count).toBeLessThan(20);
    // Clipped geometry must not respond to the raycast at the original radius location.
    const box = (await page.locator('canvas').first().boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.479, box.y + box.height * 0.557);
    await expect(page.getByRole('heading', { name: 'Anatomy, connected.' })).toBeVisible();
    await slider.focus();
    await page.keyboard.press('End');
    await expect.poll(async () => (await anatomyPixels(page)).count).toBeGreaterThan(initial.count * 0.99);
    const track = (await slider.boundingBox())!;
    await page.mouse.click(track.x + track.width / 2, track.y + track.height / 2);
    await page.mouse.move(10, 10);
    await expect.poll(async () => (await anatomyPixels(page)).count).toBeLessThan(initial.count * 0.9);
    expect((await anatomyPixels(page)).count).toBeGreaterThan(1_000);
  await reset(page);
  await expect.poll(async () => Math.abs((await anatomyPixels(page)).count - initial.count)).toBeLessThan(100);
});
}

test('orbit and reset preserve a framed hand on desktop and mobile', async ({ page }) => {
  await openViewer(page);
  const initial = await anatomyPixels(page);
  const box = (await page.locator('canvas').first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.86, box.y + box.height * 0.56, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(10, 10);
  await expect.poll(async () => Math.abs((await anatomyPixels(page)).count - initial.count)).toBeGreaterThan(1_000);
  await reset(page);
  await expect.poll(async () => Math.abs((await anatomyPixels(page)).count - initial.count)).toBeLessThan(100);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => {
    const frame = await anatomyPixels(page);
    return frame.count > 5_000 && frame.minX > 10 && frame.maxX < frame.width - 10
      && frame.minY > frame.top && frame.maxY < frame.bottom;
  }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
