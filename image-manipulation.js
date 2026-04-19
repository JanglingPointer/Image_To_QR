/**
 * Generates a mask for QR control squares and margins
 * @param {ImageData} imageData - The input image data
 * @param {number} marginSize - Size of the margin
 * @param {number} rectSize - Size of the control squares
 * @param {boolean} add4thSquare - Whether to add a 4th square in the bottom-right corner
 * @returns {ImageData} The mask image data
 */
const FOURTH_SQUARE_SIZE = 5;
const FOURTH_SQUARE_DISTANCE_FROM_BORDER = 5;

function calculateGrayLuminanceFromRgb(r, g, b) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

/**
 * Flattens image alpha by compositing on a single opaque background color.
 * @param {ImageData} imageData - Source image data
 * @param {string} outsidePixels - Outside pixel mode ('color' | others)
 * @param {string} outsidePixelsColor - Hex color used when outsidePixels is 'color'
 * @returns {ImageData} Opaque image data
 */
function flattenImageDataAlpha(imageData, outsidePixels, outsidePixelsColor) {
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (outsidePixels === "color") {
    const bg = hexToRgb(outsidePixelsColor);
    bgR = bg.r;
    bgG = bg.g;
    bgB = bg.b;
  } else {
    let weightedLuminanceSum = 0;
    let totalAlphaWeight = 0;
    const src = imageData.data;
    for (let i = 0; i < src.length; i += 4) {
      const alpha = src[i + 3];
      if (alpha === 0) continue;
      const luminance = calculateGrayLuminanceFromRgb(src[i], src[i + 1], src[i + 2]);
      weightedLuminanceSum += luminance * alpha;
      totalAlphaWeight += alpha;
    }

    if (totalAlphaWeight > 0) {
      const avgLuminance = weightedLuminanceSum / totalAlphaWeight;
      if (avgLuminance > 128) {
        bgR = 0;
        bgG = 0;
        bgB = 0;
      }
    }
  }

  const result = new ImageData(imageData.width, imageData.height);
  const src = imageData.data;
  const out = result.data;

  for (let i = 0; i < src.length; i += 4) {
    const alpha = src[i + 3] / 255;
    const invAlpha = 1 - alpha;
    out[i] = Math.round(src[i] * alpha + bgR * invAlpha);
    out[i + 1] = Math.round(src[i + 1] * alpha + bgG * invAlpha);
    out[i + 2] = Math.round(src[i + 2] * alpha + bgB * invAlpha);
    out[i + 3] = 255;
  }

  return result;
}

function readImageDataFromImageElement(image, imageSmoothingEnabled = null) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (imageSmoothingEnabled !== null) {
    ctx.imageSmoothingEnabled = imageSmoothingEnabled;
  }
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function overlayBlendChannel(baseValue, blendValue) {
  const normalizedBase = baseValue / 255;
  const normalizedBlend = blendValue / 255;
  return Math.round(
    (normalizedBase < 0.5
      ? 2 * normalizedBase * normalizedBlend
      : 1 - 2 * (1 - normalizedBase) * (1 - normalizedBlend)) * 255,
  );
}

function overlayDiagonalGradient(imageData, colorBL, colorTR) {
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(width, height);
  const rgbBL = hexToRgb(colorBL);
  const rgbTR = hexToRgb(colorTR);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x / (width - 1) + (1 - y / (height - 1))) / 2; // 0 at BL, 1 at TR
      const rGradient = Math.round(rgbBL.r * (1 - t) + rgbTR.r * t);
      const gGradient = Math.round(rgbBL.g * (1 - t) + rgbTR.g * t);
      const bGradient = Math.round(rgbBL.b * (1 - t) + rgbTR.b * t);
      const idx = (y * width + x) * 4;

      result.data[idx] = overlayBlendChannel(imageData.data[idx], rGradient);
      result.data[idx + 1] = overlayBlendChannel(
        imageData.data[idx + 1],
        gGradient,
      );
      result.data[idx + 2] = overlayBlendChannel(
        imageData.data[idx + 2],
        bGradient,
      );
      result.data[idx + 3] = imageData.data[idx + 3];
    }
  }

  return result;
}

function generateMask(imageData, marginSize, rectSize, add4thSquare = true) {
  const width = imageData.width;
  const height = imageData.height;

  const mask = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let shouldBeMasked = false;

      // Mask the margin
      if (
        y < marginSize ||
        y >= height - marginSize ||
        x < marginSize ||
        x >= width - marginSize
      ) {
        shouldBeMasked = true;
      }

      // Mask the control squares
      const isLeftStripe = x < marginSize + rectSize;
      const isRightStripe = x >= width - marginSize - rectSize;
      const isUpperStripe = y < marginSize + rectSize;
      const isLowerStripe = y >= height - marginSize - rectSize;

      if (
        (isLeftStripe && (isUpperStripe || isLowerStripe)) ||
        (isRightStripe && isUpperStripe)
      ) {
        shouldBeMasked = true;
      }

      // Add 4th square in bottom-right corner if enabled
      if (add4thSquare) {
        const squareLeft =
          width - FOURTH_SQUARE_DISTANCE_FROM_BORDER - FOURTH_SQUARE_SIZE;
        const squareRight = width - FOURTH_SQUARE_DISTANCE_FROM_BORDER;
        const squareTop =
          height - FOURTH_SQUARE_DISTANCE_FROM_BORDER - FOURTH_SQUARE_SIZE;
        const squareBottom = height - FOURTH_SQUARE_DISTANCE_FROM_BORDER;

        if (
          x >= squareLeft &&
          x < squareRight &&
          y >= squareTop &&
          y < squareBottom
        ) {
          shouldBeMasked = true;
        }
      }

      const indexBase = (y * width + x) * 4;

      for (let ch = 0; ch < 4; ++ch) {
        const index = indexBase + ch;
        let newValue = 0;

        if (shouldBeMasked) {
          newValue = 255;
        } else {
          newValue = 0;
        }

        mask.data[index] = newValue;
      }
    }
  }

  return mask;
}

/**
 * Applies a mask to an image, setting pixels to specified color where mask is active
 * @param {ImageData} image - The input image
 * @param {ImageData} mask - The mask image
 * @param {number} r - Red component
 * @param {number} g - Green component
 * @param {number} b - Blue component
 * @param {number} a - Alpha component
 * @param {boolean} invertMask - Whether to invert the mask
 * @returns {ImageData} The masked image
 */
function setWhereMasked(image, mask, r, g, b, a, invertMask) {
  if (image.width != mask.width || image.height != mask.height) {
    console.error("Size mismatch");
    return image;
  }

  const width = image.width;
  const height = image.height;

  const result = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const indexBase = (y * width + x) * 4;

      let shouldBeMasked = mask.data[indexBase] > 0;
      if (invertMask) {
        shouldBeMasked = !shouldBeMasked;
      }

      result.data[indexBase] = shouldBeMasked ? r : image.data[indexBase];
      result.data[indexBase + 1] = shouldBeMasked
        ? g
        : image.data[indexBase + 1];
      result.data[indexBase + 2] = shouldBeMasked
        ? b
        : image.data[indexBase + 2];
      result.data[indexBase + 3] = shouldBeMasked
        ? a
        : image.data[indexBase + 3];
    }
  }

  return result;
}

/**
 * Calculates the average pixel value (luminance) of an image.
 * @param {HTMLImageElement} image - The source image
 * @returns {number} Average luminance (0-255)
 */
function calculateAveragePixelValue(image) {
  const imageData = readImageDataFromImageElement(image);
  const data = imageData.data;
  let totalValue = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = calculateGrayLuminanceFromRgb(data[i], data[i + 1], data[i + 2]);
    totalValue += gray;
    pixelCount++;
  }

  return totalValue / pixelCount;
}

/**
 * Computes the block size from an image: the greatest B such that every horizontal
 * run of B consecutive pixels has identical color. Scans left-to-right per row.
 * @param {HTMLImageElement} image - The source image
 * @returns {number} Block size (1-16)
 */
function computeBlockSizeFromImage(image) {
  const data = readImageDataFromImageElement(image, false);
  const w = data.width;
  const h = data.height;
  const pixels = data.data;

  function pixelEquals(x1, y1, x2, y2) {
    const i1 = (y1 * w + x1) * 4;
    const i2 = (y2 * w + x2) * 4;
    return (
      pixels[i1] === pixels[i2] &&
      pixels[i1 + 1] === pixels[i2 + 1] &&
      pixels[i1 + 2] === pixels[i2 + 2] &&
      pixels[i1 + 3] === pixels[i2 + 3]
    );
  }

  let minRun = Infinity;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      let runLen = 1;
      while (x + runLen < w && pixelEquals(x, y, x + runLen, y)) {
        runLen++;
      }
      if (runLen < minRun) minRun = runLen;
      x += runLen;
    }
  }
  const blockSize = minRun === Infinity ? 1 : minRun;
  return Math.max(1, Math.min(blockSize, 16));
}

/**
 * Crops the center targetSize×targetSize pixels from the source image (1:1, no scaling).
 * If blockSize > 1, first downsamples by taking every blockSize-th pixel, then crops/pads.
 * If the source is smaller than targetSize, padding treatment depends on outsidePixels.
 * offsetXValue, offsetYValue (-1 to 1) shift the image position when smaller than target.
 * @param {HTMLImageElement} sourceImage - The image to crop
 * @param {number} targetSize - The square dimension to produce
 * @param {number} blockSize - Downsample factor (1 = no downsample)
 * @param {number} offsetXValue - Horizontal position offset (-1 to 1, 0 = centered)
 * @param {number} offsetYValue - Vertical position offset (-1 to 1, 0 = centered)
 * @param {string} outsidePixels - 'auto' | 'extend' | 'color' for padding treatment
 * @param {string} outsidePixelsColor - Hex color when outsidePixels is 'color'
 * @returns {ImageData} The cropped/padded image data
 */
function cropCenterPixels(
  sourceImage,
  targetSize,
  blockSize = 1,
  offsetXValue = 0,
  offsetYValue = 0,
  outsidePixels = "extend",
  outsidePixelsColor = "#000000",
) {
  let paddingColor;
  if (outsidePixels === "color") {
    paddingColor = hexToRgba(outsidePixelsColor);
  } else if (outsidePixels === "auto") {
    paddingColor = detectPaddingColor(sourceImage, true, true); // allowTransparentPadding for transparent borders
  } else {
    paddingColor = detectPaddingColor(sourceImage);
  }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sourceImage.width;
  tempCanvas.height = sourceImage.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(
    sourceImage,
    0,
    0,
    sourceImage.width,
    sourceImage.height,
    0,
    0,
    sourceImage.width,
    sourceImage.height,
  );
  let srcData = tempCtx.getImageData(
    0,
    0,
    sourceImage.width,
    sourceImage.height,
  );

  // Debug logging for blockSize processing
  // Apply downsampling for any blockSize (including 1, which will return original)
  srcData = downsampleByBlockSize(srcData, blockSize);

  const w = srcData.width;
  const h = srcData.height;

  // Calculate source crop region based on offsets (similar to scaleImageToDimensions custom mode)
  let srcX, srcY, cropW, cropH, dstX, dstY;

  if (w >= targetSize && h >= targetSize) {
    // Image is larger than or equal to target - apply offsets to cropping
    // Similar to scaleImageToDimensions custom mode when image overflows
    const overflowX = w - targetSize;
    const overflowY = h - targetSize;

    // Calculate source crop position based on offset
    const sourceCropX = (overflowX / 2) * (1 + offsetXValue);
    const sourceCropY = (overflowY / 2) * (1 + offsetYValue);

    srcX = Math.max(0, Math.min(w - targetSize, Math.round(sourceCropX)));
    srcY = Math.max(0, Math.min(h - targetSize, Math.round(sourceCropY)));
    cropW = Math.min(w - srcX, targetSize);
    cropH = Math.min(h - srcY, targetSize);

    // Position at top-left when cropping
    dstX = 0;
    dstY = 0;
  } else {
    // Image is smaller than target - apply offsets to positioning (original behavior)
    srcX = Math.max(0, Math.floor((w - targetSize) / 2));
    srcY = Math.max(0, Math.floor((h - targetSize) / 2));
    cropW = Math.min(w, targetSize);
    cropH = Math.min(h, targetSize);

    dstX = Math.max(0, Math.floor((targetSize - w) / 2));
    dstY = Math.max(0, Math.floor((targetSize - h) / 2));

    if (w < targetSize || h < targetSize) {
      const maxOffsetX = Math.max(0, Math.floor((targetSize - cropW) / 2));
      const maxOffsetY = Math.max(0, Math.floor((targetSize - cropH) / 2));
      dstX = Math.max(
        0,
        Math.min(
          targetSize - cropW,
          Math.round(dstX + offsetXValue * maxOffsetX),
        ),
      );
      dstY = Math.max(
        0,
        Math.min(
          targetSize - cropH,
          Math.round(dstY + offsetYValue * maxOffsetY),
        ),
      );
    }
  }

  const result = new ImageData(targetSize, targetSize);
  const out = result.data;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const relX = x - dstX;
      const relY = y - dstY;
      const inBounds = relX >= 0 && relX < cropW && relY >= 0 && relY < cropH;

      if (inBounds || outsidePixels === "extend") {
        const srcCol = Math.max(0, Math.min(relX, cropW - 1));
        const srcRow = Math.max(0, Math.min(relY, cropH - 1));
        const sx = srcX + srcCol;
        const sy = srcY + srcRow;
        const srcIdx = (sy * w + sx) * 4;
        const outIdx = (y * targetSize + x) * 4;
        out[outIdx] = srcData.data[srcIdx];
        out[outIdx + 1] = srcData.data[srcIdx + 1];
        out[outIdx + 2] = srcData.data[srcIdx + 2];
        out[outIdx + 3] = srcData.data[srcIdx + 3];
      } else {
        const outIdx = (y * targetSize + x) * 4;
        out[outIdx] = paddingColor[0];
        out[outIdx + 1] = paddingColor[1];
        out[outIdx + 2] = paddingColor[2];
        out[outIdx + 3] = paddingColor[3];
      }
    }
  }

  return result;
}

/**
 * Returns inner dimensions after removing a uniform border from each side.
 * @param {ImageData} imageData - Reference image dimensions
 * @param {number} borderPerSide - Border size in pixels for each side
 * @returns {{width: number, height: number, size: number}} Inner dimensions
 */
function getInnerDimensionsByBorder(imageData, borderPerSide) {
  const width = Math.max(1, imageData.width - borderPerSide * 2);
  const height = Math.max(1, imageData.height - borderPerSide * 2);
  return { width, height, size: Math.min(width, height) };
}

/**
 * Places an image inside a larger canvas at a fixed offset and fills uncovered area.
 * @param {ImageData} sourceImageData - Image to place
 * @param {number} targetWidth - Result width
 * @param {number} targetHeight - Result height
 * @param {number} offsetX - Left offset
 * @param {number} offsetY - Top offset
 * @param {number[]} fillColor - RGBA fill color
 * @returns {ImageData} Padded image data
 */
function placeImageDataAtOffset(
  sourceImageData,
  targetWidth,
  targetHeight,
  offsetX,
  offsetY,
  fillColor = [0, 0, 0, 0],
) {
  const result = new ImageData(targetWidth, targetHeight);
  const out = result.data;
  const src = sourceImageData.data;
  const fillR = fillColor[0] ?? 0;
  const fillG = fillColor[1] ?? 0;
  const fillB = fillColor[2] ?? 0;
  const fillA = fillColor[3] ?? 0;

  for (let i = 0; i < out.length; i += 4) {
    out[i] = fillR;
    out[i + 1] = fillG;
    out[i + 2] = fillB;
    out[i + 3] = fillA;
  }

  const copyWidth = Math.max(
    0,
    Math.min(sourceImageData.width, targetWidth - Math.max(0, offsetX)),
  );
  const copyHeight = Math.max(
    0,
    Math.min(sourceImageData.height, targetHeight - Math.max(0, offsetY)),
  );

  for (let y = 0; y < copyHeight; y++) {
    for (let x = 0; x < copyWidth; x++) {
      const srcIdx = (y * sourceImageData.width + x) * 4;
      const dstX = x + offsetX;
      const dstY = y + offsetY;
      if (dstX < 0 || dstY < 0 || dstX >= targetWidth || dstY >= targetHeight) {
        continue;
      }
      const dstIdx = (dstY * targetWidth + dstX) * 4;
      out[dstIdx] = src[srcIdx];
      out[dstIdx + 1] = src[srcIdx + 1];
      out[dstIdx + 2] = src[srcIdx + 2];
      out[dstIdx + 3] = src[srcIdx + 3];
    }
  }

  return result;
}

/**
 * Converts an image to black and white using a threshold
 * @param {ImageData} imageData - The input image data
 * @param {number} threshold - Threshold value (0-255)
 * @returns {ImageData} The black and white image data
 */
function convertToBlackAndWhite(imageData, threshold) {
  const result = new ImageData(imageData.width, imageData.height);
  const data = imageData.data;
  const resultData = result.data;

  for (let i = 0; i < data.length; i += 4) {
    // Calculate grayscale value (luminance)
    const gray = calculateGrayLuminanceFromRgb(data[i], data[i + 1], data[i + 2]);

    // Apply threshold
    const bw = gray > threshold ? 255 : 0;

    resultData[i] = bw; // Red
    resultData[i + 1] = bw; // Green
    resultData[i + 2] = bw; // Blue
    resultData[i + 3] = 255; // Alpha
  }

  return result;
}

/**
 * Dithers an image to black and white using random thresholding based on luminance
 * @param {ImageData} imageData - The input image data
 * @returns {ImageData} The dithered black and white image data
 */
function ditherImage(imageData) {
  const result = new ImageData(imageData.width, imageData.height);
  const data = imageData.data;
  const resultData = result.data;
  for (let i = 0; i < data.length; i += 4) {
    // Calculate grayscale value (luminance)
    const gray = calculateGrayLuminanceFromRgb(data[i], data[i + 1], data[i + 2]);
    // Probability to be white is gray/255
    const isWhite = Math.random() < gray / 255;
    const bw = isWhite ? 255 : 0;
    resultData[i] = bw; // Red
    resultData[i + 1] = bw; // Green
    resultData[i + 2] = bw; // Blue
    resultData[i + 3] = 255; // Alpha
  }
  return result;
}

/**
 * Dithers an image to black and white using Floyd–Steinberg error diffusion
 * @param {ImageData} imageData - The input image data
 * @returns {ImageData} The dithered black and white image data
 */
function floydSteinbergDither(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Float32Array(imageData.data.length);
  // Copy grayscale values into data
  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray = calculateGrayLuminanceFromRgb(
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    );
    data[i] = data[i + 1] = data[i + 2] = gray;
    data[i + 3] = 255;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldPixel = data[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      const error = oldPixel - newPixel;
      data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
      // Distribute error
      // Right
      if (x + 1 < width) {
        data[idx + 4] += (error * 7) / 16;
        data[idx + 5] += (error * 7) / 16;
        data[idx + 6] += (error * 7) / 16;
      }
      // Bottom-left
      if (x > 0 && y + 1 < height) {
        const bLeft = idx + (width - 1) * 4;
        data[bLeft] += (error * 3) / 16;
        data[bLeft + 1] += (error * 3) / 16;
        data[bLeft + 2] += (error * 3) / 16;
      }
      // Bottom
      if (y + 1 < height) {
        const b = idx + width * 4;
        data[b] += (error * 5) / 16;
        data[b + 1] += (error * 5) / 16;
        data[b + 2] += (error * 5) / 16;
      }
      // Bottom-right
      if (x + 1 < width && y + 1 < height) {
        const bRight = idx + (width + 1) * 4;
        data[bRight] += (error * 1) / 16;
        data[bRight + 1] += (error * 1) / 16;
        data[bRight + 2] += (error * 1) / 16;
      }
    }
  }
  // Create output ImageData
  const result = new ImageData(width, height);
  for (let i = 0; i < data.length; i += 4) {
    const bw = data[i] < 128 ? 0 : 255;
    result.data[i] = result.data[i + 1] = result.data[i + 2] = bw;
    result.data[i + 3] = 255;
  }
  return result;
}

/**
 * Transforms a black and white image to use custom colors
 * @param {ImageData} imageData - The input black and white image data
 * @param {string} darkColor - Hex color for black pixels
 * @param {string} brightColor - Hex color for white pixels
 * @returns {ImageData} The colored image data
 */
function applyCustomColors(imageData, darkColor, brightColor) {
  const result = new ImageData(imageData.width, imageData.height);
  const data = imageData.data;
  const resultData = result.data;

  const darkRgb = hexToRgb(darkColor);
  const brightRgb = hexToRgb(brightColor);

  for (let i = 0; i < data.length; i += 4) {
    const isBlack = data[i] === 0; // Since it's BW, we only need to check one channel

    if (isBlack) {
      resultData[i] = darkRgb.r; // Red
      resultData[i + 1] = darkRgb.g; // Green
      resultData[i + 2] = darkRgb.b; // Blue
    } else {
      resultData[i] = brightRgb.r; // Red
      resultData[i + 1] = brightRgb.g; // Green
      resultData[i + 2] = brightRgb.b; // Blue
    }
    resultData[i + 3] = 255; // Alpha
  }

  return result;
}

/**
 * Linear RGB blend of two same-size ImageData: out = base * (1 - t) + layer * t.
 * @param {ImageData} baseImageData
 * @param {ImageData} layerImageData
 * @param {number} t - 0..1
 * @returns {ImageData}
 */
function blendImageDataLinear(baseImageData, layerImageData, t) {
  const tClamped = clamp(t, 0, 1);
  const w = baseImageData.width;
  const h = baseImageData.height;
  const out = new ImageData(w, h);
  const a = baseImageData.data;
  const b = layerImageData.data;
  const o = out.data;
  const inv = 1 - tClamped;
  for (let i = 0; i < a.length; i += 4) {
    o[i] = Math.round(a[i] * inv + b[i] * tClamped);
    o[i + 1] = Math.round(a[i + 1] * inv + b[i + 1] * tClamped);
    o[i + 2] = Math.round(a[i + 2] * inv + b[i + 2] * tClamped);
    o[i + 3] = 255;
  }
  return out;
}

/**
 * Draws QR finder/control layer (qrCtrlx3) on top of an ImageData (opaque pixels replace).
 * @param {ImageData} targetImageData
 * @param {ImageData} qrCtrlx3ImageData
 * @returns {ImageData} New ImageData
 */
function compositeQrControlSquaresOnTop(targetImageData, qrCtrlx3ImageData) {
  const out = new ImageData(
    new Uint8ClampedArray(targetImageData.data),
    targetImageData.width,
    targetImageData.height,
  );
  const t = out.data;
  const c = qrCtrlx3ImageData.data;
  for (let i = 0; i < t.length; i += 4) {
    if (c[i + 3] > 0) {
      t[i] = c[i];
      t[i + 1] = c[i + 1];
      t[i + 2] = c[i + 2];
      t[i + 3] = 255;
    }
  }
  return out;
}

/**
 * Transforms a black and white image to use original image colors.
 * @param {ImageData} bwImageData - The input black and white image data (after noise + QR overlay)
 * @param {ImageData} originalImageData - The original colored image data
 * @param {ImageData} maskImageData - Mask for QR **data** modules only (e.g. qrWithoutCtrlx3), not finder/control squares.
 * @param {number} clarity - Robustness value (0-100), controls COLOR_BEND
 * @param {ImageData|null} unalteredBwImageData - Pre-noise/QR B&W image for detecting altered pixels.
 *   When provided, unaltered pixels keep original color; only altered pixels get luminance adjustment.
 * @param {number} oklchToHsbBlend - 0..1 blend ratio from OKLCH result to HSB result.
 * @param {boolean} preserveSaturation - When true (dither/threshold BW mode), overlay skips the “already-okish luminance”
 *   shortcut so data pixels always go through overlay blend. Unused for non-overlay paths.
 * @param {boolean} useOverlayBlend - If true: no-data (non-control) → original; data + OKLCH L in module band → original
 *   (unless preserveSaturation); else overlay. Control/finder pixels use B&W as when overlay is off. Bands use COLOR_BEND_OKLCH from robustness.
 * @param {ImageData|null} controlMaskImageData - QR **control** squares only (e.g. qrCtrlx3); used to exclude finder patterns from overlay “no data” path.
 * @param {ImageData|null} noiseAppliedMaskImageData - Optional mask where noise was applied, even if BW value stayed unchanged.
 * @param {ImageData|null} noisePolarityImageData - Optional 0/255 polarity map for applied-noise pixels.
 * @returns {ImageData} The colored image data using original colors
 */
function applyOriginalColors(
  bwImageData,
  originalImageData,
  maskImageData,
  clarity = 90,
  unalteredBwImageData = null,
  oklchToHsbBlend = 0,
  preserveSaturation = false,
  useOverlayBlend = false,
  controlMaskImageData = null,
  noiseAppliedMaskImageData = null,
  noisePolarityImageData = null,
) {
  const result = new ImageData(bwImageData.width, bwImageData.height);
  const bwData = bwImageData.data;
  const originalData = originalImageData.data;
  const resultData = result.data;
  const maskData = maskImageData ? maskImageData.data : null;
  const controlData = controlMaskImageData ? controlMaskImageData.data : null;
  const noiseAppliedMaskData = noiseAppliedMaskImageData
    ? noiseAppliedMaskImageData.data
    : null;
  const noisePolarityData = noisePolarityImageData
    ? noisePolarityImageData.data
    : null;
  const unalteredBwData = unalteredBwImageData
    ? unalteredBwImageData.data
    : null;
  const COLOR_BEND_BASE_OKLCH = 26;
  const COLOR_BEND_BASE_HSB = 35;
  const robustness = Math.max(0, Math.min(100, clarity));
  const COLOR_BEND_OKLCH =
    robustness <= 90
      ? 40 + ((COLOR_BEND_BASE_OKLCH - 40) * robustness) / 90
      : COLOR_BEND_BASE_OKLCH +
          ((20 - COLOR_BEND_BASE_OKLCH) * (robustness - 90)) / 10;
  const COLOR_BEND_HSB =
    robustness <= 90
      ? 40 + ((COLOR_BEND_BASE_HSB - 40) * robustness) / 90
      : COLOR_BEND_BASE_HSB + ((20 - COLOR_BEND_BASE_HSB) * (robustness - 90)) / 10;
  for (let i = 0; i < bwData.length; i += 4) {
    if (maskData && maskData[i + 3] > 0) {
      const originalR = originalData[i];
      const originalG = originalData[i + 1];
      const originalB = originalData[i + 2];

      const hasAppliedNoise =
        noiseAppliedMaskData && noiseAppliedMaskData[i + 3] > 0;
      const effectiveBwValue =
        hasAppliedNoise && noisePolarityData && noisePolarityData[i + 3] > 0
          ? noisePolarityData[i]
          : bwData[i];
      const isUnaltered =
        !!unalteredBwData && !hasAppliedNoise && bwData[i] === unalteredBwData[i];
      if (isUnaltered) {
        resultData[i] = originalR;
        resultData[i + 1] = originalG;
        resultData[i + 2] = originalB;
        resultData[i + 3] = 255;
        continue;
      }

      const isBlack = effectiveBwValue === 0;

      if (useOverlayBlend) {
        const originalOklch = rgbToOklch(originalR, originalG, originalB);
        const oklchLMatchesDataPixel = isBlack
          ? originalOklch.l <= COLOR_BEND_OKLCH
          : originalOklch.l >= 100 - COLOR_BEND_OKLCH;
        if (oklchLMatchesDataPixel && !preserveSaturation) {
          resultData[i] = originalR;
          resultData[i + 1] = originalG;
          resultData[i + 2] = originalB;
          resultData[i + 3] = 255;
          continue;
        }
        const dataR = effectiveBwValue;
        const dataG = effectiveBwValue;
        const dataB = effectiveBwValue;
        const adjustedRgb = photoshopOverlayBlendRgb(
          originalR,
          originalG,
          originalB,
          dataR,
          dataG,
          dataB,
        );
        resultData[i] = adjustedRgb.r;
        resultData[i + 1] = adjustedRgb.g;
        resultData[i + 2] = adjustedRgb.b;
        resultData[i + 3] = 255;
        continue;
      }

      const MIN_GAP = 20;
      let adjustedRgbOklch;

      const originalOklch = rgbToOklch(originalR, originalG, originalB);
      let darkLightness = Math.min(originalOklch.l, COLOR_BEND_OKLCH);
      let brightLightness = Math.max(originalOklch.l, 100 - COLOR_BEND_OKLCH);
      if (brightLightness - darkLightness < MIN_GAP) {
        const mid = (darkLightness + brightLightness) / 2;
        darkLightness = Math.max(0, mid - MIN_GAP / 2);
        brightLightness = Math.min(100, mid + MIN_GAP / 2);
      }

      if (isBlack) {
        adjustedRgbOklch = oklchToRgb(
          darkLightness,
          originalOklch.c,
          originalOklch.h,
        );
      } else {
        adjustedRgbOklch = oklchToRgb(
          brightLightness,
          originalOklch.c,
          originalOklch.h,
        );
      }

      const originalHsb = rgbToHsb(originalR, originalG, originalB);
      let darkBrightness = Math.min(originalHsb.b, COLOR_BEND_HSB);
      let brightBrightness = Math.max(originalHsb.b, 100 - COLOR_BEND_HSB);
      if (brightBrightness - darkBrightness < MIN_GAP) {
        const mid = (darkBrightness + brightBrightness) / 2;
        darkBrightness = Math.max(0, mid - MIN_GAP / 2);
        brightBrightness = Math.min(100, mid + MIN_GAP / 2);
      }
      const adjustedRgbHsb = isBlack
        ? hsbToRgb(originalHsb.h, originalHsb.s, darkBrightness)
        : hsbToRgb(originalHsb.h, originalHsb.s, brightBrightness);
      const adjustedRgb = blendRgb(
        adjustedRgbOklch,
        adjustedRgbHsb,
        oklchToHsbBlend,
      );

      resultData[i] = adjustedRgb.r;
      resultData[i + 1] = adjustedRgb.g;
      resultData[i + 2] = adjustedRgb.b;
      resultData[i + 3] = 255;
    } else {
      const isControlPixel = controlData && controlData[i + 3] > 0;
      if (useOverlayBlend && !isControlPixel) {
        resultData[i] = originalData[i];
        resultData[i + 1] = originalData[i + 1];
        resultData[i + 2] = originalData[i + 2];
      } else {
        resultData[i] = bwData[i];
        resultData[i + 1] = bwData[i + 1];
        resultData[i + 2] = bwData[i + 2];
      }
      resultData[i + 3] = 255;
    }
  }
  return result;
}

/**
 * Helper for seeded random number generator (Mulberry32)
 * @param {number} seed - The seed value
 * @returns {Function} A random number generator function
 */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Adds black and white noise to an image by inverting random pixels
 * @param {ImageData} imageData - The input black and white image data
 * @param {number} noiseProbability - Probability of pixel inversion (0-100)
 * @param {number} seed - Seed for the random generator
 * @param {boolean} randomizePolarity - When true, changed pixels become random black/white
 * @returns {ImageData} The image with noise added
 */
function addNoiseToImage(imageData, noiseProbability, seed, randomizePolarity = false) {
  return generateNoiseArtifacts(
    imageData,
    noiseProbability,
    seed,
    randomizePolarity,
  ).noisyImageData;
}

/**
 * Deterministically chooses black/white noise polarity from position and seed.
 * @param {number} x
 * @param {number} y
 * @param {number} baseSeed
 * @returns {0|255}
 */
function getDeterministicNoisePolarity(x, y, baseSeed) {
  let h =
    (baseSeed ^ Math.imul(x + 1, 0x1f123bb5) ^ Math.imul(y + 1, 0x5f356495)) >>>
    0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return (h & 1) === 0 ? 0 : 255;
}

/**
 * Generates both the noisy BW image and explicit noise artifacts.
 * @param {ImageData} baseBwImageData - Base black/white image
 * @param {number} noiseProbability - Probability of pixel inversion (0-100)
 * @param {number} seed - Seed for the random generator
 * @param {boolean} randomizePolarity - When true, changed pixels become random black/white
 * @returns {{
 *   noisyImageData: ImageData,
 *   noiseLayerImageData: ImageData,
 *   noiseAppliedMaskImageData: ImageData,
 *   noisePolarityImageData: ImageData,
 * }}
 */
function generateNoiseArtifacts(
  baseBwImageData,
  noiseProbability,
  seed,
  randomizePolarity = false,
) {
  const noisyImageData = new ImageData(baseBwImageData.width, baseBwImageData.height);
  const noiseLayerImageData = new ImageData(
    baseBwImageData.width,
    baseBwImageData.height,
  );
  const noiseAppliedMaskImageData = new ImageData(
    baseBwImageData.width,
    baseBwImageData.height,
  );
  const noisePolarityImageData = new ImageData(
    baseBwImageData.width,
    baseBwImageData.height,
  );
  const data = baseBwImageData.data;
  const noiseLayerData = noiseLayerImageData.data;
  const noiseAppliedMaskData = noiseAppliedMaskImageData.data;
  const noisePolarityData = noisePolarityImageData.data;
  const width = baseBwImageData.width;
  const height = baseBwImageData.height;
  const noisyData = noisyImageData.data;
  // Use seeded random generator
  const rand = mulberry32(seed);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      // Copy the original pixel
      noisyData[index] = data[index]; // Red
      noisyData[index + 1] = data[index + 1]; // Green
      noisyData[index + 2] = data[index + 2]; // Blue
      noisyData[index + 3] = data[index + 3]; // Alpha
      // Check if all pixels in 3x3 neighborhood have the same color
      let allSameColor = true;
      const centerColor = data[index]; // Since it's BW, we only need to check one channel
      // Check 3x3 neighborhood
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          // Skip if outside image bounds
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            continue;
          }
          const neighborIndex = (ny * width + nx) * 4;
          if (data[neighborIndex] !== centerColor) {
            allSameColor = false;
            break;
          }
        }
        if (!allSameColor) break;
      }
      // Adjust probability based on neighborhood uniformity
      let adjustedProbability = allSameColor
        ? noiseProbability
        : noiseProbability * 0.15;

      // Halve probability if x % 3 == 1 or y % 3 == 1
      if (x % 3 === 1 || y % 3 === 1) {
        adjustedProbability *= 0.15;
      }

      // Apply noise with adjusted probability
      if (rand() * 100 < adjustedProbability) {
        const noiseValue = randomizePolarity
          ? getDeterministicNoisePolarity(x, y, seed)
          : data[index] === 0
            ? 255
            : 0;
        noisyData[index] = noiseValue; // Red
        noisyData[index + 1] = noiseValue; // Green
        noisyData[index + 2] = noiseValue; // Blue
        noiseAppliedMaskData[index + 3] = 255;
        noisePolarityData[index] = noiseValue;
        noisePolarityData[index + 1] = noiseValue;
        noisePolarityData[index + 2] = noiseValue;
        noisePolarityData[index + 3] = 255;
        if (noiseValue !== data[index]) {
          noiseLayerData[index] = noiseValue;
          noiseLayerData[index + 1] = noiseValue;
          noiseLayerData[index + 2] = noiseValue;
          noiseLayerData[index + 3] = 255;
        }
        // Alpha stays the same
      }
    }
  }
  return {
    noisyImageData,
    noiseLayerImageData,
    noiseAppliedMaskImageData,
    noisePolarityImageData,
  };
}

/**
 * Tints control pixels using trimmed OKLCH lightness bounds from non-control pixels.
 * Uses full RGB colors from darkest/brightest retained samples.
 * @param {ImageData} imageData - Colored image to modify
 * @param {ImageData} controlMaskImageData - Mask of control pixels (alpha > 0)
 * @returns {ImageData} Tinted image
 */
function tintControlPixelsByTrimmedLightness(imageData, controlMaskImageData) {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );
  if (!controlMaskImageData) return result;

  const data = result.data;
  const maskData = controlMaskImageData.data;
  const samples = [];

  // Analyze only non-control pixels.
  for (let i = 0; i < data.length; i += 4) {
    const isControlPixel = maskData[i + 3] > 0;
    if (!isControlPixel && data[i + 3] > 0) {
      const oklch = rgbToOklch(data[i], data[i + 1], data[i + 2]);
      samples.push({
        l: oklch.l,
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
    }
  }

  if (samples.length === 0) return result;

  samples.sort((a, b) => a.l - b.l);
  const trimCount = Math.floor(samples.length * 0.1);
  const start = Math.min(trimCount, samples.length - 1);
  const end = Math.max(start + 1, samples.length - trimCount);
  const trimmed = samples.slice(start, end);
  const analyzedSamples = trimmed.length > 0 ? trimmed : samples;

  const darkRgb = analyzedSamples[0];
  const brightRgb = analyzedSamples[analyzedSamples.length - 1];

  // Map control black/white pixels to A/B.
  for (let i = 0; i < data.length; i += 4) {
    if (maskData[i + 3] > 0) {
      const isBlack = maskData[i] < 128;
      const mapped = isBlack ? darkRgb : brightRgb;
      data[i] = mapped.r;
      data[i + 1] = mapped.g;
      data[i + 2] = mapped.b;
      data[i + 3] = 255;
    }
  }

  return result;
}

/**
 * Generates QR code ImageData directly from modules without any scaling
 * @param {string} text - The text to encode in the QR code
 * @returns {Promise<ImageData>} The QR code as ImageData
 */
async function getQRCodeImageData(text) {
  if (text === "") {
    text = " ";
  }

  return await new Promise((resolve, reject) => {
    QRCode.toString(
      text,
      { errorCorrectionLevel: "H" },
      function (error, qrString) {
        if (error) {
          console.error("QR Code Generation Error: " + error);
          reject(error);
          return;
        }

        const modules = QRCode.create(text, {
          errorCorrectionLevel: "H",
        }).modules;
        const size = modules.size;
        const imageData = new ImageData(size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const value = modules.get(x, y) ? 1 : 0;
            const index = y * size + x;
            const pixelIndex = index * 4;

            if (value === 1) {
              data[pixelIndex] = 0; // Red
              data[pixelIndex + 1] = 0; // Green
              data[pixelIndex + 2] = 0; // Blue
              data[pixelIndex + 3] = 255; // Alpha
            } else {
              data[pixelIndex] = 255; // Red
              data[pixelIndex + 1] = 255; // Green
              data[pixelIndex + 2] = 255; // Blue
              data[pixelIndex + 3] = 255; // Alpha
            }
          }
        }

        resolve(imageData);
      },
    );
  });
}

/**
 * Margin, control/data masks, 3× scales, and thinned data modules — same pipeline with or without an uploaded image.
 * @param {string} text
 * @param {boolean} add4thSquare
 * @returns {Promise<{
 *   qr_noMargin: ImageData,
 *   qr: ImageData,
 *   qrCtrlMask: ImageData,
 *   qrCtrl: ImageData,
 *   qrCtrlx3: ImageData,
 *   qrWithoutCtrl: ImageData,
 *   qrWithoutCtrlx3: ImageData,
 *   qrWithoutCtrlThinned: ImageData,
 * }>}
 */
async function buildQrLayerImageData(text, add4thSquare) {
  const qr_noMargin = await getQRCodeImageData(text);
  const shouldAdd4thSquare = add4thSquare && qr_noMargin.width >= 25;
  const qr = addMargin(1, qr_noMargin);
  const qrCtrlMask = generateMask(qr, 1, 8, shouldAdd4thSquare);
  const qrCtrl = setWhereMasked(qr, qrCtrlMask, 0, 0, 0, 0, true);
  const qrCtrlx3 = scale3Image(qrCtrl);
  const qrWithoutCtrl = setWhereMasked(qr, qrCtrlMask, 0, 0, 0, 0, false);
  const qrWithoutCtrlx3 = scale3Image(qrWithoutCtrl);
  const qrWithoutCtrlThinned = onlyKeepCenterPixelOf3x3Block(qrWithoutCtrlx3);
  return {
    qr_noMargin,
    qr,
    qrCtrlMask,
    qrCtrl,
    qrCtrlx3,
    qrWithoutCtrl,
    qrWithoutCtrlx3,
    qrWithoutCtrlThinned,
  };
}

/**
 * Generates a QR code overlay on the uploaded image using the complex processing pipeline
 * @param {HTMLImageElement|null} uploadedImage - The image to overlay the QR code on, or null for a plain scaled QR preview
 * @param {string} text - The text/URL to encode in the QR code
 * @param {number} threshold - Threshold for black and white conversion (0-255)
 * @param {number} scaleFactor - Scale factor for final output (1-8)
 * @param {number} noiseProbability - Probability of pixel inversion for noise (0-100)
 * @param {string} darkColor - Hex color for dark pixels (default: "#000000")
 * @param {string} brightColor - Hex color for bright pixels (default: "#ffffff")
 * @param {boolean} useOriginalColors - Whether to use original image colors (default: false)
 * @param {number} noiseSeed - Seed for the noise generation
 * @param {string} scalingMode - 'shrink', 'grow', or 'stretch' for uploaded image scaling
 * @param {boolean} shine - Whether to apply a diagonal gradient shine (default: false)
 * @param {string} bwMode - 'threshold' | 'dither' | 'original_colors' for black and white conversion
 * @param {number} ditherGamma - Gamma value for dither brightness (default: 1.0)
 * @param {number} saturationBoost - Saturation boost value (0-1)
 * @param {number} zoomValue - Zoom factor for custom mode (0-2)
 * @param {number} offsetXValue - Horizontal offset for custom mode (-1 to 1)
 * @param {number} offsetYValue - Vertical offset for custom mode (-1 to 1)
 * @param {number} clarity - Robustness value (0-100), controls COLOR_BEND
 * @param {boolean} add4thSquare - Whether to add a 4th square in the bottom-right corner
 * @param {number} oklchPre - 0..1 blend from scaled image toward pure OKLCH component
 * @param {number} overlayAmount - 0..1 blend toward overlay-mode component
 * @param {number} hsbAmount - 0..1 blend toward pure HSB component
 * @param {boolean} tintCtrlPixels - Whether to tint control pixels from image lightness statistics
 * @param {string} outsidePixels - 'auto' | 'extend' | 'color' for padding treatment
 * @param {string} outsidePixelsColor - Hex color when outsidePixels is 'color'
 * @returns {Object} Object containing debug data including qrWithoutCtrlx3
 */
async function generateQRCodeOverlay(
  uploadedImage,
  text,
  threshold = 128,
  scaleFactor = 3,
  noiseProbability = 15,
  darkColor = "#000000",
  brightColor = "#ffffff",
  useOriginalColors = false,
  noiseSeed = 54321,
  scalingMode = "shrink",
  shine = false,
  bwMode = "threshold",
  ditherGamma = 1.0,
  saturationBoost = 0,
  zoomValue = 0,
  offsetXValue = 0,
  offsetYValue = 0,
  clarity = 90,
  add4thSquare = true,
  oklchPre = 1,
  overlayAmount = 0,
  hsbAmount = 0,
  tintCtrlPixels = false,
  blockSize = 1,
  outsidePixels = "auto",
  outsidePixelsColor = "#000000",
) {
  try {
    const {
      qr_noMargin,
      qr,
      qrCtrlMask,
      qrCtrl,
      qrCtrlx3,
      qrWithoutCtrl,
      qrWithoutCtrlx3,
      qrWithoutCtrlThinned,
    } = await buildQrLayerImageData(text, add4thSquare);

    if (!uploadedImage) {
      const result_colored_xN = scaleImageByFactor(scale3Image(qr), scaleFactor);
      const canvas = document.getElementById("resultCanvas");
      const ctx = canvas.getContext("2d");
      canvas.width = result_colored_xN.width;
      canvas.height = result_colored_xN.height;
      ctx.putImageData(result_colored_xN, 0, 0);
      return {
        qr_noMargin,
        qr,
        qrCtrlMask,
        qrCtrl,
        qrCtrlx3,
        qrWithoutCtrl,
        qrWithoutCtrlx3,
        qrWithoutCtrlThinned,
        result_colored_xN,
      };
    }

    // Step 9: Scale uploaded image to inner QR area (excluding 3px border on each side)
    let scaledUploadedImage;
    const ctrlBorderPerSide = 3;
    const innerTarget = getInnerDimensionsByBorder(qrCtrlx3, ctrlBorderPerSide);

    // Check if we're in pixel perfect mode (blockSize >= 1)
    // blockSize >= 1 means pixel-perfect mode, blockSize = 0 means regular scaling mode
    const isPixelPerfect = blockSize >= 1;

    let scaledUploadedImageInner;
    if (isPixelPerfect) {
      // For pixel perfect mode, use cropCenterPixels
      scaledUploadedImageInner = cropCenterPixels(
        uploadedImage,
        innerTarget.size,
        blockSize,
        offsetXValue,
        offsetYValue,
        outsidePixels,
        outsidePixelsColor,
      );
    } else {
      // Use regular scaling for non-pixel-perfect modes (blockSize === 0)
      const effectiveZoomValue = scalingMode === "custom" ? zoomValue : 0;
      const effectiveOffsetXValue = scalingMode === "custom" ? offsetXValue : 0;
      const effectiveOffsetYValue = scalingMode === "custom" ? offsetYValue : 0;

      scaledUploadedImageInner = scaleImageToDimensions(
        uploadedImage,
        innerTarget.width,
        innerTarget.height,
        scalingMode,
        effectiveZoomValue,
        effectiveOffsetXValue,
        effectiveOffsetYValue,
        outsidePixels,
        outsidePixelsColor,
      );
    }

    // Insert the inner image into full QR resolution so downstream steps keep matching dimensions.
    let borderFillColor;
    if (outsidePixels === "color") {
      borderFillColor = hexToRgba(outsidePixelsColor);
    } else if (outsidePixels === "auto") {
      borderFillColor = detectPaddingColor(uploadedImage, true, true);
    } else {
      borderFillColor = [0, 0, 0, 0];
    }

    scaledUploadedImage = placeImageDataAtOffset(
      scaledUploadedImageInner,
      qrCtrlx3.width,
      qrCtrlx3.height,
      ctrlBorderPerSide,
      ctrlBorderPerSide,
      borderFillColor,
    );
    scaledUploadedImage = flattenImageDataAlpha(
      scaledUploadedImage,
      outsidePixels,
      outsidePixelsColor,
    );

    // Step 10: Convert uploaded image to BW (with optional dither gamma)
    let scaledUploadedImage_Gamma = null;
    let scaledUploadedImageBW;
    if (bwMode === "original_colors") {
      scaledUploadedImageBW = convertToBlackAndWhite(scaledUploadedImage, 128);
    } else if (bwMode === "dither") {
      // Apply brightness/contrast adjustment to grayscale before dithering
      // ditherGamma now ranges from -1 (darken, more contrast), 0 (no change), 1 (brighten, more contrast)
      scaledUploadedImage_Gamma = new ImageData(
        scaledUploadedImage.width,
        scaledUploadedImage.height,
      );
      for (let i = 0; i < scaledUploadedImage.data.length; i += 4) {
        // Calculate grayscale value (luminance)
        const gray = calculateGrayLuminanceFromRgb(
          scaledUploadedImage.data[i],
          scaledUploadedImage.data[i + 1],
          scaledUploadedImage.data[i + 2],
        );
        // Apply brightness/contrast adjustment
        // x = ditherGamma, range [-1, 1]
        let x = ditherGamma;
        let out = (gray - 128) * (1 + Math.abs(x)) + 128 + x * 128;
        out = Math.max(0, Math.min(255, Math.round(out)));
        scaledUploadedImage_Gamma.data[i] = out;
        scaledUploadedImage_Gamma.data[i + 1] = out;
        scaledUploadedImage_Gamma.data[i + 2] = out;
        scaledUploadedImage_Gamma.data[i + 3] = 255;
      }
      // Dither the adjusted image
      scaledUploadedImageBW = floydSteinbergDither(scaledUploadedImage_Gamma);
    } else {
      scaledUploadedImageBW = convertToBlackAndWhite(
        scaledUploadedImage,
        threshold,
      );
    }

    // Step 11: Add noise to black and white image
    const {
      noisyImageData: scaledUploadedImageBW_Noise,
      noiseAppliedMaskImageData: scaledUploadedImageBW_NoiseAppliedMask,
      noisePolarityImageData: scaledUploadedImageBW_NoisePolarity,
    } = generateNoiseArtifacts(
      scaledUploadedImageBW,
      noiseProbability,
      noiseSeed,
      useOriginalColors,
    );

    // Step 11b: Noisy BW + thinned QR data only (no finder/control squares) — used for OKLCH/HSB/Overlay components
    const scaledUploadedImageBW_plusDataOnly = new ImageData(
      scaledUploadedImageBW_Noise.width,
      scaledUploadedImageBW_Noise.height,
    );
    const bwDataOnlyData = scaledUploadedImageBW_plusDataOnly.data;
    for (let i = 0; i < scaledUploadedImageBW_Noise.data.length; i++) {
      bwDataOnlyData[i] = scaledUploadedImageBW_Noise.data[i];
    }
    const qrWithoutCtrlThinnedDataOnly = qrWithoutCtrlThinned.data;
    const scaledUploadedImageBW_plusDataOnly_NoiseAppliedMask = new ImageData(
      scaledUploadedImageBW_NoiseAppliedMask.width,
      scaledUploadedImageBW_NoiseAppliedMask.height,
    );
    const plusDataOnlyNoiseAppliedMaskData =
      scaledUploadedImageBW_plusDataOnly_NoiseAppliedMask.data;
    for (let i = 0; i < scaledUploadedImageBW_NoiseAppliedMask.data.length; i++) {
      plusDataOnlyNoiseAppliedMaskData[i] = scaledUploadedImageBW_NoiseAppliedMask.data[i];
    }
    const scaledUploadedImageBW_plusDataOnly_NoisePolarity = new ImageData(
      scaledUploadedImageBW_NoisePolarity.width,
      scaledUploadedImageBW_NoisePolarity.height,
    );
    const plusDataOnlyNoisePolarityData =
      scaledUploadedImageBW_plusDataOnly_NoisePolarity.data;
    for (let i = 0; i < scaledUploadedImageBW_NoisePolarity.data.length; i++) {
      plusDataOnlyNoisePolarityData[i] = scaledUploadedImageBW_NoisePolarity.data[i];
    }
    for (let i = 0; i < qrWithoutCtrlThinnedDataOnly.length; i += 4) {
      if (qrWithoutCtrlThinnedDataOnly[i + 3] > 0) {
        bwDataOnlyData[i] = qrWithoutCtrlThinnedDataOnly[i];
        bwDataOnlyData[i + 1] = qrWithoutCtrlThinnedDataOnly[i + 1];
        bwDataOnlyData[i + 2] = qrWithoutCtrlThinnedDataOnly[i + 2];
        bwDataOnlyData[i + 3] = qrWithoutCtrlThinnedDataOnly[i + 3];
        plusDataOnlyNoiseAppliedMaskData[i + 3] = 0;
        plusDataOnlyNoisePolarityData[i + 3] = 0;
      }
    }

    // Step 12: Create BW image with control squares (using noisy image as base)
    const scaledUploadedImageBW_plusCtrl = new ImageData(
      scaledUploadedImageBW_Noise.width,
      scaledUploadedImageBW_Noise.height,
    );
    const bwPlusCtrlData = scaledUploadedImageBW_plusCtrl.data;

    // Copy the noisy black and white image
    for (let i = 0; i < scaledUploadedImageBW_Noise.data.length; i++) {
      bwPlusCtrlData[i] = scaledUploadedImageBW_Noise.data[i];
    }

    // Overlay the control squares
    const qrCtrlx3Data = qrCtrlx3.data;
    for (let i = 0; i < qrCtrlx3Data.length; i += 4) {
      if (qrCtrlx3Data[i + 3] > 0) {
        // If pixel is not transparent
        bwPlusCtrlData[i] = qrCtrlx3Data[i]; // Red
        bwPlusCtrlData[i + 1] = qrCtrlx3Data[i + 1]; // Green
        bwPlusCtrlData[i + 2] = qrCtrlx3Data[i + 2]; // Blue
        bwPlusCtrlData[i + 3] = qrCtrlx3Data[i + 3]; // Alpha
      }
    }

    // Step 13: Create BW image with control squares and QR data
    const scaledUploadedImageBW_plusAllQR = new ImageData(
      scaledUploadedImageBW_plusCtrl.width,
      scaledUploadedImageBW_plusCtrl.height,
    );
    const bwPlusAllQRData = scaledUploadedImageBW_plusAllQR.data;

    // Copy the BW image with control squares
    for (let i = 0; i < scaledUploadedImageBW_plusCtrl.data.length; i++) {
      bwPlusAllQRData[i] = scaledUploadedImageBW_plusCtrl.data[i];
    }

    // Overlay the thinned QR code data
    const qrWithoutCtrlThinnedData = qrWithoutCtrlThinned.data;
    for (let i = 0; i < qrWithoutCtrlThinnedData.length; i += 4) {
      if (qrWithoutCtrlThinnedData[i + 3] > 0) {
        // If pixel is not transparent
        bwPlusAllQRData[i] = qrWithoutCtrlThinnedData[i]; // Red
        bwPlusAllQRData[i + 1] = qrWithoutCtrlThinnedData[i + 1]; // Green
        bwPlusAllQRData[i + 2] = qrWithoutCtrlThinnedData[i + 2]; // Blue
        bwPlusAllQRData[i + 3] = qrWithoutCtrlThinnedData[i + 3]; // Alpha
      }
    }

    // Step 14: Apply colors to create colored result
    let result_colored;
    let component_oklch = null;
    let component_hsb = null;
    let component_overlay = null;
    if (useOriginalColors) {
      let unalteredBw = null;
      if (bwMode === "original_colors") {
        unalteredBw = new ImageData(
          new Uint8ClampedArray(scaledUploadedImageBW.data),
          scaledUploadedImageBW.width,
          scaledUploadedImageBW.height,
        );
        const qrThinnedData = qrWithoutCtrlThinned.data;
        for (let i = 0; i < qrThinnedData.length; i += 4) {
          if (qrThinnedData[i + 3] > 0) {
            const inv = bwDataOnlyData[i] === 0 ? 255 : 0;
            unalteredBw.data[i] = inv;
            unalteredBw.data[i + 1] = inv;
            unalteredBw.data[i + 2] = inv;
            unalteredBw.data[i + 3] = 255;
          }
        }
      }
      const preserveSaturation =
        bwMode === "dither" || bwMode === "threshold";
      // Pure OKLCH: leaves pixels unchanged where data BW still matches the unaltered BW, or OKLCH L is already at the dark/bright extreme for the module.
      component_oklch = applyOriginalColors(
        scaledUploadedImageBW_plusDataOnly,
        scaledUploadedImage,
        qrWithoutCtrlx3,
        clarity,
        unalteredBw,
        0,
        preserveSaturation,
        false,
        null,
        scaledUploadedImageBW_plusDataOnly_NoiseAppliedMask,
        scaledUploadedImageBW_plusDataOnly_NoisePolarity,
      );
      // Pure HSB: leaves pixels unchanged where data BW still matches the unaltered BW, or brightness is already at the dark/bright extreme for the module.
      component_hsb = applyOriginalColors(
        scaledUploadedImageBW_plusDataOnly,
        scaledUploadedImage,
        qrWithoutCtrlx3,
        clarity,
        unalteredBw,
        1,
        preserveSaturation,
        false,
        null,
        scaledUploadedImageBW_plusDataOnly_NoiseAppliedMask,
        scaledUploadedImageBW_plusDataOnly_NoisePolarity,
      );
      // Overlay: leaves pixels unchanged where data BW still matches the unaltered BW, original OKLCH L already matches the module band, or the pixel is outside the data mask (non-control).
      component_overlay = applyOriginalColors(
        scaledUploadedImageBW_plusDataOnly,
        scaledUploadedImage,
        qrWithoutCtrlx3,
        clarity,
        unalteredBw,
        0,
        preserveSaturation,
        true,
        null,
        scaledUploadedImageBW_plusDataOnly_NoiseAppliedMask,
        scaledUploadedImageBW_plusDataOnly_NoisePolarity,
      );
      let acc = new ImageData(
        new Uint8ClampedArray(scaledUploadedImage.data),
        scaledUploadedImage.width,
        scaledUploadedImage.height,
      );
      acc = blendImageDataLinear(acc, component_oklch, oklchPre);
      acc = blendImageDataLinear(acc, component_overlay, overlayAmount);
      result_colored = blendImageDataLinear(acc, component_hsb, hsbAmount);
      result_colored = compositeQrControlSquaresOnTop(result_colored, qrCtrlx3);
    } else {
      result_colored = applyCustomColors(
        scaledUploadedImageBW_plusAllQR,
        darkColor,
        brightColor,
      );
    }
    // Step 15: Apply saturation boost as a post-processing step
    if (result_colored && saturationBoost > 0 && useOriginalColors) {
      const data = result_colored.data;
      for (let i = 0; i < data.length; i += 4) {
        const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        let s = hsl.s;
        const vibranceAmount = 0.6 * saturationBoost;
        const saturationAmount = 0.25 * saturationBoost;
        const vibranceBoost = (1 - s / 100) * vibranceAmount * 100;
        s = Math.min(s + vibranceBoost, 100);
        s = Math.min(s * (1 + saturationAmount), 100);
        const rgb = hslToRgb(hsl.h, s, hsl.l);
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
      }
    }

    // Step 16: Build shine-adjusted colored result
    let result_colored_shine = null;
    if (result_colored) {
      let preShine = result_colored;
      // If shine is enabled and darkColor is black and brightColor is white, gray the image a bit
      if (
        shine &&
        darkColor.toLowerCase() === "#000000" &&
        brightColor.toLowerCase() === "#ffffff"
      ) {
        preShine = new ImageData(result_colored.width, result_colored.height);
        for (let i = 0; i < result_colored.data.length; i += 4) {
          const r = result_colored.data[i];
          const g = result_colored.data[i + 1];
          const b = result_colored.data[i + 2];
          const a = result_colored.data[i + 3];
          let hsl = rgbToHsl(r, g, b);
          // Lerp lightness toward 0.5 by 0.1
          hsl.l = hsl.l + (50 - hsl.l) * 0.1;
          const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
          preShine.data[i] = rgb.r;
          preShine.data[i + 1] = rgb.g;
          preShine.data[i + 2] = rgb.b;
          preShine.data[i + 3] = a;
        }
      }
      if (shine) {
        result_colored_shine = overlayDiagonalGradient(
          preShine,
          "#35456c",
          "#fffea0",
        );
      } else {
        result_colored_shine = new ImageData(
          new Uint8ClampedArray(preShine.data),
          preShine.width,
          preShine.height,
        );
      }
    }

    // Step 17: Optionally tint control pixels based on trimmed image lightness bounds
    if (result_colored_shine && tintCtrlPixels) {
      // qrCtrlx3 has the exact control-pixel footprint in result_colored_shine resolution.
      result_colored_shine = tintControlPixelsByTrimmedLightness(
        result_colored_shine,
        qrCtrlx3,
      );
    }

    // Step 18: Create scaled version of the colored result (from result_colored_shine)
    const result_colored_xN = result_colored_shine
      ? scaleImageByFactor(result_colored_shine, scaleFactor)
      : null;

    // Step 19: Create final canvas and overlay
    const canvas = document.getElementById("resultCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = result_colored_xN.width;
    canvas.height = result_colored_xN.height;

    // Draw the scaled colored composite image
    ctx.putImageData(result_colored_xN, 0, 0);

    // Return debug data
    return {
      qr_noMargin: qr_noMargin,
      qr: qr,
      qrCtrlMask: qrCtrlMask,
      qrCtrl: qrCtrl,
      qrCtrlx3: qrCtrlx3,
      qrWithoutCtrl: qrWithoutCtrl,
      qrWithoutCtrlx3: qrWithoutCtrlx3,
      qrWithoutCtrlThinned: qrWithoutCtrlThinned,
      scaledUploadedImage: scaledUploadedImage,
      scaledUploadedImageBW: scaledUploadedImageBW,
      scaledUploadedImageBW_Noise: scaledUploadedImageBW_Noise,
      scaledUploadedImageBW_plusCtrl: scaledUploadedImageBW_plusCtrl,
      scaledUploadedImageBW_plusAllQR: scaledUploadedImageBW_plusAllQR,
      result_colored: result_colored,
      result_colored_xN: result_colored_xN,
      result_colored_shine: result_colored_shine,
      ...(component_oklch
        ? {
            component_oklch,
            component_hsb,
            component_overlay,
          }
        : {}),
      // Add gamma debug image if present
      ...(scaledUploadedImage_Gamma ? { scaledUploadedImage_Gamma } : {}),
    };
  } catch (error) {
    console.error("Error in QR code processing pipeline:", error);
    throw error;
  }
}

// Export for use in other modules
window.generateQRCodeOverlay = generateQRCodeOverlay;
window.generateNoiseArtifacts = generateNoiseArtifacts;
window.computeBlockSizeFromImage = computeBlockSizeFromImage;
window.calculateAveragePixelValue = calculateAveragePixelValue;
window.calculateLuminance = calculateLuminance;
