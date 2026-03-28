/**
 * Image scaling and dimension utilities.
 */

/**
 * Scales an image by a given factor (each pixel becomes NxN pixels)
 * @param {ImageData} imageData - The input image data
 * @param {number} scaleFactor - The scaling factor (N)
 * @returns {ImageData} The scaled image data
 */
function scaleImageByFactor(imageData, scaleFactor) {
  const oldWidth = imageData.width;
  const oldHeight = imageData.height;

  const newWidth = oldWidth * scaleFactor;
  const newHeight = oldHeight * scaleFactor;
  const newImageData = new ImageData(newWidth, newHeight);

  for (let y = 0; y < oldHeight; y++) {
    for (let x = 0; x < oldWidth; x++) {
      const oldIndex = (y * oldWidth + x) * 4;
      const r = imageData.data[oldIndex];
      const g = imageData.data[oldIndex + 1];
      const b = imageData.data[oldIndex + 2];
      const a = imageData.data[oldIndex + 3];

      for (let dy = 0; dy < scaleFactor; dy++) {
        for (let dx = 0; dx < scaleFactor; dx++) {
          const newX = x * scaleFactor + dx;
          const newY = y * scaleFactor + dy;
          const newIndex = (newY * newWidth + newX) * 4;

          newImageData.data[newIndex] = r;
          newImageData.data[newIndex + 1] = g;
          newImageData.data[newIndex + 2] = b;
          newImageData.data[newIndex + 3] = a;
        }
      }
    }
  }

  return newImageData;
}

/**
 * Scales an image by a factor of 3 (every pixel becomes a 3x3 block)
 * @param {ImageData} imageData - The input image data
 * @returns {ImageData} The scaled image data
 */
function scale3Image(imageData) {
  return scaleImageByFactor(imageData, 3);
}

/**
 * Keeps only the center pixel of every 3x3 block
 * @param {ImageData} image - The input image
 * @returns {ImageData} The thinned image
 */
function onlyKeepCenterPixelOf3x3Block(image) {
  if (image.width % 3 != 0 || image.height % 3 != 0) {
    console.error("Size mismatch - dimensions must be divisible by 3");
    return image;
  }

  const width = image.width;
  const height = image.height;

  const result = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const indexBase = (y * width + x) * 4;

      let shouldBeKept = x % 3 == 1 && y % 3 == 1;

      result.data[indexBase] = shouldBeKept ? image.data[indexBase] : 0;
      result.data[indexBase + 1] = shouldBeKept ? image.data[indexBase + 1] : 0;
      result.data[indexBase + 2] = shouldBeKept ? image.data[indexBase + 2] : 0;
      result.data[indexBase + 3] = shouldBeKept ? image.data[indexBase + 3] : 0;
    }
  }

  return result;
}

// Backward compatible alias for existing callers.
function onlyKeepCenterPixelOf9x9Block(image) {
  return onlyKeepCenterPixelOf3x3Block(image);
}

/**
 * Downsamples ImageData by taking every N-th pixel (nearest-neighbor).
 * @param {ImageData} imageData - The source image data
 * @param {number} blockSize - Take every blockSize-th pixel (1 = no change)
 * @returns {ImageData} The downsampled image data
 */
function downsampleByBlockSize(imageData, blockSize) {
  if (blockSize < 1) return imageData;
  const w = imageData.width;
  const h = imageData.height;
  const newW = Math.ceil(w / blockSize);
  const newH = Math.ceil(h / blockSize);
  const result = new ImageData(newW, newH);
  const src = imageData.data;
  const out = result.data;
  for (let j = 0; j < newH; j++) {
    for (let i = 0; i < newW; i++) {
      const sx = Math.min(i * blockSize, w - 1);
      const sy = Math.min(j * blockSize, h - 1);
      const srcIdx = (sy * w + sx) * 4;
      const outIdx = (j * newW + i) * 4;
      out[outIdx] = src[srcIdx];
      out[outIdx + 1] = src[srcIdx + 1];
      out[outIdx + 2] = src[srcIdx + 2];
      out[outIdx + 3] = src[srcIdx + 3];
    }
  }
  return result;
}

/**
 * Scales an image to match the dimensions while maintaining aspect ratio
 * @param {HTMLImageElement} sourceImage - The image to scale
 * @param {number} targetWidth - Target width
 * @param {number} targetHeight - Target height
 * @param {string} scalingMode - 'shrink', 'grow', 'stretch', or 'custom'
 * @param {number} zoomValue - Zoom factor for custom mode (0-2)
 * @param {number} offsetXValue - Horizontal offset for custom mode (-1 to 1)
 * @param {number} offsetYValue - Vertical offset for custom mode (-1 to 1)
 * @param {string} outsidePixels - 'auto' | 'extend' | 'color' for padding treatment
 * @param {string} outsidePixelsColor - Hex color when outsidePixels is 'color'
 * @returns {ImageData} The scaled image data with padding
 */
function scaleImageToDimensions(
  sourceImage,
  targetWidth,
  targetHeight,
  scalingMode = "shrink",
  zoomValue = 0,
  offsetXValue = 0,
  offsetYValue = 0,
  outsidePixels = "auto",
  outsidePixelsColor = "#000000",
) {
  let bgColor;
  if (outsidePixels === "color") {
    bgColor = hexToRgba(outsidePixelsColor);
  } else if (outsidePixels === "extend") {
    bgColor = [0, 0, 0, 0];
  } else {
    bgColor = detectPaddingColor(sourceImage);
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = `rgba(${bgColor[0]},${bgColor[1]},${bgColor[2]},${bgColor[3] / 255})`;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  const sourceAspect = sourceImage.width / sourceImage.height;
  const targetAspect = targetWidth / targetHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (scalingMode === "stretch") {
    drawWidth = targetWidth;
    drawHeight = targetHeight;
    offsetX = 0;
    offsetY = 0;
  } else if (scalingMode === "grow") {
    if (sourceAspect > targetAspect) {
      drawHeight = targetHeight;
      drawWidth = targetHeight * sourceAspect;
      offsetX = (targetWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = targetWidth;
      drawHeight = targetWidth / sourceAspect;
      offsetX = 0;
      offsetY = (targetHeight - drawHeight) / 2;
    }
  } else if (scalingMode === "custom") {
    const zoomFactor = 1 + zoomValue;

    let scaledWidth, scaledHeight;
    if (sourceAspect > targetAspect) {
      scaledWidth = targetWidth * zoomFactor;
      scaledHeight = scaledWidth / sourceAspect;
    } else {
      scaledHeight = targetHeight * zoomFactor;
      scaledWidth = scaledHeight * sourceAspect;
    }

    drawWidth = scaledWidth;
    drawHeight = scaledHeight;
    offsetX = (targetWidth - drawWidth) / 2;
    offsetY = (targetHeight - drawHeight) / 2;

    const scaleX = sourceImage.width / drawWidth;
    const scaleY = sourceImage.height / drawHeight;

    let finalDrawWidth, finalOffsetX, finalSourceCropX, finalSourceCropWidth;
    if (drawWidth <= targetWidth) {
      const maxOffsetX = (targetWidth - drawWidth) / 2;
      finalDrawWidth = drawWidth;
      finalOffsetX = offsetX + offsetXValue * maxOffsetX;
      finalSourceCropX = 0;
      finalSourceCropWidth = sourceImage.width;
    } else {
      const overflowX = drawWidth - targetWidth;
      const sourceCropAmountX = overflowX * scaleX;
      const sourceCropX = (sourceCropAmountX / 2) * (1 + offsetXValue);
      finalDrawWidth = targetWidth;
      finalOffsetX = 0;
      finalSourceCropX = Math.max(
        0,
        Math.min(sourceImage.width - sourceCropAmountX, sourceCropX),
      );
      finalSourceCropWidth = Math.min(
        sourceImage.width - finalSourceCropX,
        sourceImage.width - sourceCropAmountX,
      );
    }

    let finalDrawHeight, finalOffsetY, finalSourceCropY, finalSourceCropHeight;
    if (drawHeight <= targetHeight) {
      const maxOffsetY = (targetHeight - drawHeight) / 2;
      finalDrawHeight = drawHeight;
      finalOffsetY = offsetY + offsetYValue * maxOffsetY;
      finalSourceCropY = 0;
      finalSourceCropHeight = sourceImage.height;
    } else {
      const overflowY = drawHeight - targetHeight;
      const sourceCropAmountY = overflowY * scaleY;
      const sourceCropY = (sourceCropAmountY / 2) * (1 + offsetYValue);
      finalDrawHeight = targetHeight;
      finalOffsetY = 0;
      finalSourceCropY = Math.max(
        0,
        Math.min(sourceImage.height - sourceCropAmountY, sourceCropY),
      );
      finalSourceCropHeight = Math.min(
        sourceImage.height - finalSourceCropY,
        sourceImage.height - sourceCropAmountY,
      );
    }

    ctx.drawImage(
      sourceImage,
      finalSourceCropX,
      finalSourceCropY,
      finalSourceCropWidth,
      finalSourceCropHeight,
      finalOffsetX,
      finalOffsetY,
      finalDrawWidth,
      finalDrawHeight,
    );
    const result = ctx.getImageData(0, 0, targetWidth, targetHeight);
    if (outsidePixels === "extend") {
      const extendLeft = Math.round(finalOffsetX);
      const extendTop = Math.round(finalOffsetY);
      const extendRight = Math.round(finalOffsetX + finalDrawWidth);
      const extendBottom = Math.round(finalOffsetY + finalDrawHeight);

      extendPaddingInImageData(
        result,
        extendLeft,
        extendTop,
        extendRight - extendLeft,
        extendBottom - extendTop,
      );
    }
    return result;
  } else {
    if (sourceAspect > targetAspect) {
      drawWidth = targetWidth;
      drawHeight = targetWidth / sourceAspect;
      offsetX = 0;
      offsetY = (targetHeight - drawHeight) / 2;
    } else {
      drawHeight = targetHeight;
      drawWidth = targetHeight * sourceAspect;
      offsetX = (targetWidth - drawWidth) / 2;
      offsetY = 0;
    }
  }

  ctx.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);

  const result = ctx.getImageData(0, 0, targetWidth, targetHeight);
  if (outsidePixels === "extend") {
    const extendLeft = Math.round(offsetX);
    const extendTop = Math.round(offsetY);
    const extendRight = Math.round(offsetX + drawWidth);
    const extendBottom = Math.round(offsetY + drawHeight);

    extendPaddingInImageData(
      result,
      extendLeft,
      extendTop,
      extendRight - extendLeft,
      extendBottom - extendTop,
    );
  }
  return result;
}
