/**
 * Padding and margin utilities for images.
 */

/**
 * Adds a margin around an image
 * @param {number} marginSize - Size of the margin in pixels
 * @param {ImageData} imageData - The input image data
 * @returns {ImageData} The image with margin
 */
function addMargin(marginSize, imageData) {
  const width = imageData.width;
  const height = imageData.height;

  const newWidth = width + 2 * marginSize;
  const newHeight = height + 2 * marginSize;

  const result = new ImageData(newWidth, newHeight);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const isMargin =
        y < marginSize ||
        y >= marginSize + height ||
        x < marginSize ||
        x >= marginSize + width;

      const indexBaseNew = (y * newWidth + x) * 4;
      const indexBaseOld = ((y - marginSize) * width + (x - marginSize)) * 4;

      for (let ch = 0; ch < 4; ++ch) {
        const indexNew = indexBaseNew + ch;
        const indexOld = indexBaseOld + ch;

        let newValue = 0;

        if (isMargin) {
          newValue = 255.0;
        } else {
          newValue = imageData.data[indexOld];
        }

        result.data[indexNew] = newValue;
      }
    }
  }

  return result;
}

/**
 * Determines the background/padding color for a source image by examining corner pixels
 * and transparency. Returns an RGBA array [r, g, b, a].
 * @param {HTMLImageElement} sourceImage - The source image
 * @param {boolean} useTransparencyOverride - If true, override corner color with a
 *   contrasting opaque color when the image has significant transparency. Default true.
 * @param {boolean} allowTransparentPadding - If true, return transparent when corners
 *   are transparent (for padding that should match transparent borders). Default false.
 * @returns {number[]} RGBA background color array
 */
function detectPaddingColor(
  sourceImage,
  useTransparencyOverride = true,
  allowTransparentPadding = false,
) {
  function colorsAlmostEqual(a, b, tolerance = 10) {
    return (
      Math.abs(a[0] - b[0]) <= tolerance &&
      Math.abs(a[1] - b[1]) <= tolerance &&
      Math.abs(a[2] - b[2]) <= tolerance &&
      Math.abs(a[3] - b[3]) <= tolerance
    );
  }
  function averageColors(colors) {
    const avg = [0, 0, 0, 0];
    for (const c of colors) {
      for (let i = 0; i < 4; ++i) avg[i] += c[i];
    }
    for (let i = 0; i < 4; ++i) avg[i] = Math.round(avg[i] / colors.length);
    return avg;
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sourceImage.width;
  tempCanvas.height = sourceImage.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(sourceImage, 0, 0);
  const tempData = tempCtx.getImageData(
    0,
    0,
    sourceImage.width,
    sourceImage.height,
  ).data;

  function getPixel(x, y) {
    const i = (y * sourceImage.width + x) * 4;
    return [tempData[i], tempData[i + 1], tempData[i + 2], tempData[i + 3]];
  }

  const corners = [
    getPixel(0, 0),
    getPixel(sourceImage.width - 1, 0),
    getPixel(0, sourceImage.height - 1),
    getPixel(sourceImage.width - 1, sourceImage.height - 1),
  ];

  let bgColor = [255, 255, 255, 255];
  let found = false;
  for (let i = 0; i < 4; ++i) {
    let count = 1;
    for (let j = 0; j < 4; ++j) {
      if (i !== j && colorsAlmostEqual(corners[i], corners[j])) count++;
    }
    if (count >= 2) {
      bgColor = corners[i];
      found = true;
      break;
    }
  }
  if (!found) {
    const avg = averageColors(corners);
    const brightness = 0.299 * avg[0] + 0.587 * avg[1] + 0.114 * avg[2];
    bgColor = brightness < 128 ? [0, 0, 0, 255] : [255, 255, 255, 255];
  }

  if (allowTransparentPadding) {
    const avgCornerAlpha =
      (corners[0][3] + corners[1][3] + corners[2][3] + corners[3][3]) / 4;
    if (avgCornerAlpha < 128) {
      return [0, 0, 0, 0];
    }
  }

  if (useTransparencyOverride) {
    let sum = 0,
      count = 0;
    let transparentPixels = 0;
    for (let i = 0; i < tempData.length; i += 4) {
      if (tempData[i + 3] < 255) transparentPixels++;
      if (tempData[i + 3] > 0) {
        sum +=
          tempData[i] * 0.299 +
          tempData[i + 1] * 0.587 +
          tempData[i + 2] * 0.114;
        count++;
      }
    }
    const transparencyRatio = transparentPixels / (tempData.length / 4);
    if (transparencyRatio > 0.1 && count > 0) {
      const avg = sum / count;
      return avg > 128 ? [0, 0, 0, 255] : [255, 255, 255, 255];
    }
  }
  return bgColor;
}

/**
 * Extends padding pixels by sampling from the nearest edge of the drawn image.
 * Uses integer bounds to handle fractional draw coordinates correctly.
 * @param {ImageData} imageData - The image data (modified in place)
 * @param {number} imgX - Left edge of the image content
 * @param {number} imgY - Top edge of the image content
 * @param {number} imgW - Width of the image content
 * @param {number} imgH - Height of the image content
 */
function extendPaddingInImageData(imageData, imgX, imgY, imgW, imgH) {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const leftCol = Math.max(0, Math.floor(imgX));
  const topRow = Math.max(0, Math.floor(imgY));
  const rightCol = Math.min(w - 1, Math.ceil(imgX + imgW) - 1);
  const bottomRow = Math.min(h - 1, Math.ceil(imgY + imgH) - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= leftCol && x <= rightCol && y >= topRow && y <= bottomRow)
        continue;
      const sampleX = Math.max(leftCol, Math.min(rightCol, x));
      const sampleY = Math.max(topRow, Math.min(bottomRow, y));
      const srcIdx = (sampleY * w + sampleX) * 4;
      const dstIdx = (y * w + x) * 4;
      data[dstIdx] = data[srcIdx];
      data[dstIdx + 1] = data[srcIdx + 1];
      data[dstIdx + 2] = data[srcIdx + 2];
      data[dstIdx + 3] = data[srcIdx + 3];
    }
  }
}
