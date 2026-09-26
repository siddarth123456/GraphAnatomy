import type { Page } from '@playwright/test';

/** Inspect the browser's rendered pixels, including WebGL, rather than store state. */
export async function anatomyPixels(page: Page) {
  const canvas = page.locator('canvas').first();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The anatomy canvas has no visible bounds.');
  // The canvas stays fixed in the workspace. Capture its actual pixels without
  // repeated scroll/stability actions, which stall on software-rendered CI.
  const screenshot = await page.screenshot({ clip: bounds });
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

