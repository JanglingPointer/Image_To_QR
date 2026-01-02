/**
 * Scales an image by a factor of 3 (every pixel becomes a 3x3 block)
 * @param {ImageData} imageData - The input image data
 * @returns {ImageData} The scaled image data
 */
function scale3Image(imageData) {
    const oldWidth = imageData.width;
    const oldHeight = imageData.height;
    
    const newWidth = oldWidth * 3;
    const newHeight = oldHeight * 3;
    const newImageData = new ImageData(newWidth, newHeight);

    for (let y = 0; y < oldHeight; y++) {
        for (let x = 0; x < oldWidth; x++) {
            const oldIndex = (y * oldWidth + x) * 4;
            const r = imageData.data[oldIndex];
            const g = imageData.data[oldIndex + 1];
            const b = imageData.data[oldIndex + 2];
            const a = imageData.data[oldIndex + 3];

            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    const newX = x * 3 + dx;
                    const newY = y * 3 + dy;
                    const newIndex = (newY * newWidth + newX) * 4;

                    newImageData.data[newIndex] = r;     // Red
                    newImageData.data[newIndex + 1] = g; // Green
                    newImageData.data[newIndex + 2] = b; // Blue
                    newImageData.data[newIndex + 3] = a; // Alpha
                }
            }
        }
    }

    return newImageData;
}

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

                    newImageData.data[newIndex] = r;     // Red
                    newImageData.data[newIndex + 1] = g; // Green
                    newImageData.data[newIndex + 2] = b; // Blue
                    newImageData.data[newIndex + 3] = a; // Alpha
                }
            }
        }
    }

    return newImageData;
}

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
            const isMargin = y < marginSize || y >= marginSize + height
                          || x < marginSize || x >= marginSize + width;

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
 * Generates a mask for QR control squares and margins
 * @param {ImageData} imageData - The input image data
 * @param {number} marginSize - Size of the margin
 * @param {number} rectSize - Size of the control squares
 * @param {boolean} add4thSquare - Whether to add a 4th square in the bottom-right corner
 * @returns {ImageData} The mask image data
 */
function generateMask(imageData, marginSize, rectSize, add4thSquare = true) {
    const width = imageData.width;
    const height = imageData.height;
    
    const mask = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let shouldBeMasked = false;

            // Mask the margin
            if (y < marginSize || y >= height - marginSize
             || x < marginSize || x >= width - marginSize) {
                shouldBeMasked = true;
            }

            // Mask the control squares
            const isLeftStripe = (x < marginSize + rectSize);
            const isRightStripe = (x >= width - marginSize - rectSize);
            const isUpperStripe = (y < marginSize + rectSize);
            const isLowerStripe = (y >= height - marginSize - rectSize);

            if ((isLeftStripe && (isUpperStripe || isLowerStripe)) ||
                (isRightStripe && isUpperStripe)) {
                shouldBeMasked = true;
            }

            // Add 4th square in bottom-right corner if enabled
            if (add4thSquare) {
                const squareSize = 5;
                const distanceFromBorder = 5;
                const squareLeft = width - distanceFromBorder - squareSize;
                const squareRight = width - distanceFromBorder;
                const squareTop = height - distanceFromBorder - squareSize;
                const squareBottom = height - distanceFromBorder;
                
                if (x >= squareLeft && x < squareRight && y >= squareTop && y < squareBottom) {
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
            result.data[indexBase + 1] = shouldBeMasked ? g : image.data[indexBase + 1];
            result.data[indexBase + 2] = shouldBeMasked ? b : image.data[indexBase + 2];
            result.data[indexBase + 3] = shouldBeMasked ? a : image.data[indexBase + 3];
        }
    }

    return result;
}

/**
 * Keeps only the center pixel of every 3x3 block
 * @param {ImageData} image - The input image
 * @returns {ImageData} The thinned image
 */
function onlyKeepCenterPixelOf9x9Block(image) {
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

/**
 * Scales an image to match the dimensions while maintaining aspect ratio
 * @param {HTMLImageElement} sourceImage - The image to scale
 * @param {number} targetWidth - Target width
 * @param {number} targetHeight - Target height
 * @param {string} scalingMode - 'shrink', 'grow', 'stretch', or 'custom'
 * @param {number} zoomValue - Zoom factor for custom mode (0-2)
 * @param {number} offsetXValue - Horizontal offset for custom mode (-1 to 1)
 * @param {number} offsetYValue - Vertical offset for custom mode (-1 to 1)
 * @returns {ImageData} The scaled image data with white padding
 */
function scaleImageToDimensions(sourceImage, targetWidth, targetHeight, scalingMode = 'shrink', zoomValue = 0, offsetXValue = 0, offsetYValue = 0) {
    // Helper to get RGBA from image at (x, y)
    function getPixel(img, x, y) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(x, y, 1, 1).data;
        return [data[0], data[1], data[2], data[3]];
    }
    // Helper to compare two RGBA colors (allowing small difference)
    function colorsAlmostEqual(a, b, tolerance = 10) {
        return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance && Math.abs(a[2] - b[2]) <= tolerance && Math.abs(a[3] - b[3]) <= tolerance;
    }
    // Helper to average four RGBA colors
    function averageColors(colors) {
        const avg = [0, 0, 0, 0];
        for (const c of colors) {
            for (let i = 0; i < 4; ++i) avg[i] += c[i];
        }
        for (let i = 0; i < 4; ++i) avg[i] = Math.round(avg[i] / colors.length);
        return avg;
    }
    // Determine background color for all modes
    let bgColor = [255, 255, 255, 255];
    const c1 = getPixel(sourceImage, 0, 0);
    const c2 = getPixel(sourceImage, sourceImage.width - 1, 0);
    const c3 = getPixel(sourceImage, 0, sourceImage.height - 1);
    const c4 = getPixel(sourceImage, sourceImage.width - 1, sourceImage.height - 1);
    const corners = [c1, c2, c3, c4];
    // Count how many are almost equal to each other
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
        // Average the four
        const avg = averageColors(corners);
        // Use black if dark, white if bright
        const brightness = 0.299 * avg[0] + 0.587 * avg[1] + 0.114 * avg[2];
        bgColor = brightness < 128 ? [0, 0, 0, 255] : [255, 255, 255, 255];
    }
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Check if the image has alpha and compute average brightness of non-transparent pixels
    let overlayBg = null;
    // Draw image to temp canvas to inspect alpha
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceImage.width;
    tempCanvas.height = sourceImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(sourceImage, 0, 0);
    const tempImageData = tempCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    const tempData = tempImageData.data;
    let sum = 0, count = 0;
    let hasAlpha = false;
    for (let i = 0; i < tempData.length; i += 4) {
        const alpha = tempData[i + 3];
        if (alpha > 0) {
            hasAlpha = true;
            // Calculate grayscale value (luminance)
            const gray = tempData[i] * 0.299 + tempData[i + 1] * 0.587 + tempData[i + 2] * 0.114;
            sum += gray;
            count++;
        }
    }
    // Only use alpha-based background if there's significant transparency
    let hasSignificantAlpha = false;
    if (hasAlpha && count > 0) {
        // Check if there are many transparent pixels
        let transparentPixels = 0;
        for (let i = 3; i < tempData.length; i += 4) {
            if (tempData[i] < 255) transparentPixels++;
        }
        const transparencyRatio = transparentPixels / (tempData.length / 4);
        hasSignificantAlpha = transparencyRatio > 0.1; // More than 10% transparent pixels
        
        if (hasSignificantAlpha) {
            const avg = sum / count;
            // If average is bright, use black background, else use white
            overlayBg = avg > 128 ? 'black' : 'white';
        }
    }
    // Fill background
    if (overlayBg && hasSignificantAlpha) {
        ctx.fillStyle = overlayBg;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
        ctx.fillStyle = `rgba(${bgColor[0]},${bgColor[1]},${bgColor[2]},${bgColor[3] / 255})`;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    
    // Calculate scaling to maintain aspect ratio
    const sourceAspect = sourceImage.width / sourceImage.height;
    const targetAspect = targetWidth / targetHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (scalingMode === 'stretch') {
        // Stretch: ignore aspect ratio
        drawWidth = targetWidth;
        drawHeight = targetHeight;
        offsetX = 0;
        offsetY = 0;
    } else if (scalingMode === 'grow') {
        // Grow: scale so the smallest dimension matches target, keep aspect ratio
        if (sourceAspect > targetAspect) {
            // Source is wider, so height is limiting
            drawHeight = targetHeight;
            drawWidth = targetHeight * sourceAspect;
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Source is taller, so width is limiting
            drawWidth = targetWidth;
            drawHeight = targetWidth / sourceAspect;
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
        }
    } else if (scalingMode === 'custom') {
        // Custom: scale based on zoom value
        // At zoom -1: biggest side = targetWidth * 0.5 (zoomed out)
        // At zoom 0: biggest side = targetWidth
        // At zoom 2: biggest side = targetWidth * 2 (zoomed in)
        const zoomFactor = 1 + zoomValue; // 0.5 at zoom -1, 1 at zoom 0, 3 at zoom 2
        
        // Calculate the scaled dimensions while maintaining aspect ratio
        let scaledWidth, scaledHeight;
        if (sourceAspect > targetAspect) {
            // Source is wider - scale to fit width
            scaledWidth = targetWidth * zoomFactor;
            scaledHeight = scaledWidth / sourceAspect;
        } else {
            // Source is taller - scale to fit height
            scaledHeight = targetHeight * zoomFactor;
            scaledWidth = scaledHeight * sourceAspect;
        }
        
        // Calculate positioning
        drawWidth = scaledWidth;
        drawHeight = scaledHeight;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = (targetHeight - drawHeight) / 2;
        
        // Apply offset values for custom mode - handle X and Y independently
        // Calculate the scale factor between source and destination
        const scaleX = sourceImage.width / drawWidth;
        const scaleY = sourceImage.height / drawHeight;
        
        // Handle X dimension
        let finalDrawWidth, finalOffsetX, finalSourceCropX, finalSourceCropWidth;
        if (drawWidth <= targetWidth) {
            // X dimension fits - apply offset to positioning
            const maxOffsetX = (targetWidth - drawWidth) / 2;
            finalDrawWidth = drawWidth;
            finalOffsetX = offsetX + offsetXValue * maxOffsetX;
            finalSourceCropX = 0;
            finalSourceCropWidth = sourceImage.width;
        } else {
            // X dimension is too large - apply offset to cropping
            const overflowX = drawWidth - targetWidth;
            const sourceCropAmountX = overflowX * scaleX;
            const sourceCropX = (sourceCropAmountX / 2) * (1 + offsetXValue);
            finalDrawWidth = targetWidth;
            finalOffsetX = 0;
            finalSourceCropX = Math.max(0, Math.min(sourceImage.width - sourceCropAmountX, sourceCropX));
            finalSourceCropWidth = Math.min(sourceImage.width - finalSourceCropX, sourceImage.width - sourceCropAmountX);
        }
        
        // Handle Y dimension
        let finalDrawHeight, finalOffsetY, finalSourceCropY, finalSourceCropHeight;
        if (drawHeight <= targetHeight) {
            // Y dimension fits - apply offset to positioning
            const maxOffsetY = (targetHeight - drawHeight) / 2;
            finalDrawHeight = drawHeight;
            finalOffsetY = offsetY + offsetYValue * maxOffsetY;
            finalSourceCropY = 0;
            finalSourceCropHeight = sourceImage.height;
        } else {
            // Y dimension is too large - apply offset to cropping
            const overflowY = drawHeight - targetHeight;
            const sourceCropAmountY = overflowY * scaleY;
            const sourceCropY = (sourceCropAmountY / 2) * (1 + offsetYValue);
            finalDrawHeight = targetHeight;
            finalOffsetY = 0;
            finalSourceCropY = Math.max(0, Math.min(sourceImage.height - sourceCropAmountY, sourceCropY));
            finalSourceCropHeight = Math.min(sourceImage.height - finalSourceCropY, sourceImage.height - sourceCropAmountY);
        }
        
        // Use drawImage with source and destination parameters
        ctx.drawImage(sourceImage, finalSourceCropX, finalSourceCropY, finalSourceCropWidth, finalSourceCropHeight, finalOffsetX, finalOffsetY, finalDrawWidth, finalDrawHeight);
        return ctx.getImageData(0, 0, targetWidth, targetHeight);
    } else {
        // Shrink: scale so the largest dimension matches target, keep aspect ratio (default)
        if (sourceAspect > targetAspect) {
            // Source is wider - scale to fit width
            drawWidth = targetWidth;
            drawHeight = targetWidth / sourceAspect;
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
        } else {
            // Source is taller - scale to fit height
            drawHeight = targetHeight;
            drawWidth = targetHeight * sourceAspect;
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
        }
    }
    
    // Draw the image centered with aspect ratio maintained
    ctx.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);
    
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
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
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Apply threshold
        const bw = gray > threshold ? 255 : 0;
        
        resultData[i] = bw;     // Red
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
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        // Probability to be white is gray/255
        const isWhite = Math.random() < (gray / 255);
        const bw = isWhite ? 255 : 0;
        resultData[i] = bw;     // Red
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
        const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
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
                data[idx + 4] += error * 7 / 16;
                data[idx + 5] += error * 7 / 16;
                data[idx + 6] += error * 7 / 16;
            }
            // Bottom-left
            if (x > 0 && y + 1 < height) {
                const bLeft = idx + (width - 1) * 4;
                data[bLeft] += error * 3 / 16;
                data[bLeft + 1] += error * 3 / 16;
                data[bLeft + 2] += error * 3 / 16;
            }
            // Bottom
            if (y + 1 < height) {
                const b = idx + width * 4;
                data[b] += error * 5 / 16;
                data[b + 1] += error * 5 / 16;
                data[b + 2] += error * 5 / 16;
            }
            // Bottom-right
            if (x + 1 < width && y + 1 < height) {
                const bRight = idx + (width + 1) * 4;
                data[bRight] += error * 1 / 16;
                data[bRight + 1] += error * 1 / 16;
                data[bRight + 2] += error * 1 / 16;
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
 * Converts a hex color string to RGB values
 * @param {string} hexColor - Hex color string (e.g., "#ff0000")
 * @returns {Object} Object with r, g, b values (0-255)
 */
function hexToRgb(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return { r, g, b };
}

/**
 * Converts RGB values to HSL
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} Object with h, s, l values (h: 0-360, s: 0-100, l: 0-100)
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

/**
 * Converts HSL values to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Object} Object with r, g, b values (0-255)
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Converts RGB values to hex color string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string (e.g., "#ff0000")
 */
function rgbToHex(r, g, b) {
    const toHex = (c) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
            resultData[i] = darkRgb.r;     // Red
            resultData[i + 1] = darkRgb.g; // Green
            resultData[i + 2] = darkRgb.b; // Blue
        } else {
            resultData[i] = brightRgb.r;     // Red
            resultData[i + 1] = brightRgb.g; // Green
            resultData[i + 2] = brightRgb.b; // Blue
        }
        resultData[i + 3] = 255; // Alpha
    }
    
    return result;
}

/**
 * Transforms a black and white image to use original image colors with HSL adjustments
 * @param {ImageData} bwImageData - The input black and white image data
 * @param {ImageData} originalImageData - The original colored image data
 * @param {ImageData} maskImageData - The mask image data (for useOriginalColors = true)
 * @param {number} saturationBoost - Saturation boost value (0-1)
 * @param {number} robustness - Robustness value (0-100), controls COLOR_BEND (0 → 35, 100 → 0)
 * @returns {ImageData} The colored image data using original colors
 */
function applyOriginalColors(bwImageData, originalImageData, maskImageData, saturationBoost = 0, robustness = 50) {
    // maskImageData: only apply original colors where mask alpha > 0
    // bwImageData: scaledUploadedImageBW_plusAllQR
    const result = new ImageData(bwImageData.width, bwImageData.height);
    const bwData = bwImageData.data;
    const originalData = originalImageData.data;
    const resultData = result.data;
    const maskData = maskImageData ? maskImageData.data : null;
    for (let i = 0; i < bwData.length; i += 4) {
        if (maskData && maskData[i + 3] > 0) {
            // Use original color logic (as before)
            const isBlack = bwData[i] === 0;
            const originalR = originalData[i];
            const originalG = originalData[i + 1];
            const originalB = originalData[i + 2];
            const originalHsl = rgbToHsl(originalR, originalG, originalB);
            let adjustedLightness;
            let adjustedSaturation = originalHsl.s;
            if (saturationBoost > 0) {
                // Scale vibrance and saturation boost by slider value
                let vibranceAmount = 0.6 * saturationBoost;
                let saturationAmount = 0.25 * saturationBoost;
                // Vibrance: only boost if not already saturated
                let vibranceBoost = (1 - (adjustedSaturation / 100)) * vibranceAmount * 100;
                adjustedSaturation = Math.min(adjustedSaturation + vibranceBoost, 100);
                // Global saturation boost
                adjustedSaturation = Math.min(adjustedSaturation * (1 + saturationAmount), 100);
            }
            // Calculate COLOR_BEND from robustness: 0 → 35, 100 → 0
            const COLOR_BEND = 35 * (1 - robustness / 100);
            if (isBlack) {
                adjustedLightness = Math.min(originalHsl.l, COLOR_BEND);
            } else {
                adjustedLightness = Math.max(originalHsl.l, 100 - COLOR_BEND);
            }
            const adjustedRgb = hslToRgb(originalHsl.h, adjustedSaturation, adjustedLightness);
            resultData[i] = adjustedRgb.r;
            resultData[i + 1] = adjustedRgb.g;
            resultData[i + 2] = adjustedRgb.b;
            resultData[i + 3] = 255;
        } else {
            // Copy color directly from bwImageData (scaledUploadedImageBW_plusAllQR)
            resultData[i] = bwData[i];
            resultData[i + 1] = bwData[i + 1];
            resultData[i + 2] = bwData[i + 2];
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
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Adds black and white noise to an image by inverting random pixels
 * @param {ImageData} imageData - The input black and white image data
 * @param {number} noiseProbability - Probability of pixel inversion (0-100)
 * @param {number} seed - Seed for the random generator
 * @returns {ImageData} The image with noise added
 */
function addNoiseToImage(imageData, noiseProbability, seed) {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const width = imageData.width;
    const height = imageData.height;
    // Use seeded random generator
    const rand = mulberry32(seed);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            // Copy the original pixel
            resultData[index] = data[index];     // Red
            resultData[index + 1] = data[index + 1]; // Green
            resultData[index + 2] = data[index + 2]; // Blue
            resultData[index + 3] = data[index + 3]; // Alpha
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
            let adjustedProbability = allSameColor ? noiseProbability : noiseProbability * 0.15;
            
            // Halve probability if x % 3 == 1 or y % 3 == 1
            if (x % 3 === 1 || y % 3 === 1) {
                adjustedProbability *= 0.15;
            }

            // Apply noise with adjusted probability
            if (rand() * 100 < adjustedProbability) {
                // Invert the pixel (black becomes white, white becomes black)
                resultData[index] = data[index] === 0 ? 255 : 0;     // Red
                resultData[index + 1] = data[index + 1] === 0 ? 255 : 0; // Green
                resultData[index + 2] = data[index + 2] === 0 ? 255 : 0; // Blue
                // Alpha stays the same
            }
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
        QRCode.toString(text, { errorCorrectionLevel: 'H' }, 
            async function (error, qrString) {
                if (error) {
                    console.error('QR Code Generation Error: ' + error);
                    reject(error);
                    return;
                }

                const modules = QRCode.create(text, { errorCorrectionLevel: 'H' }).modules;
                const size = modules.size;
                const imageData = new ImageData(size, size);
                const data = imageData.data;

                for (let y = 0; y < size; y++) {
                    for (let x = 0; x < size; x++) {
                        const value = modules.get(x, y) ? 1 : 0;
                        const index = y * size + x;
                        const pixelIndex = index * 4;

                        if (value === 1) {
                            data[pixelIndex] = 0;     // Red
                            data[pixelIndex + 1] = 0; // Green
                            data[pixelIndex + 2] = 0; // Blue
                            data[pixelIndex + 3] = 255; // Alpha
                        } else {
                            data[pixelIndex] = 255;     // Red
                            data[pixelIndex + 1] = 255; // Green
                            data[pixelIndex + 2] = 255; // Blue
                            data[pixelIndex + 3] = 255; // Alpha
                        }
                    }
                }

                resolve(imageData);
            }
        );
    });
}

/**
 * Generates a QR code overlay on the uploaded image using the complex processing pipeline
 * @param {HTMLImageElement} uploadedImage - The image to overlay the QR code on
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
 * @param {string} bwMode - 'threshold' or 'dither' for black and white conversion
 * @param {number} ditherGamma - Gamma value for dither brightness (default: 1.0)
 * @param {number} saturationBoost - Saturation boost value (0-1)
 * @param {number} zoomValue - Zoom factor for custom mode (0-2)
 * @param {number} offsetXValue - Horizontal offset for custom mode (-1 to 1)
 * @param {number} offsetYValue - Vertical offset for custom mode (-1 to 1)
 * @param {number} robustness - Robustness value (0-100) for color adjustment, controls COLOR_BEND
 * @param {boolean} add4thSquare - Whether to add a 4th square in the bottom-right corner
 * @returns {Object} Object containing debug data including qrWithoutCtrlx3
 */
async function generateQRCodeOverlay(uploadedImage, text, threshold = 128, scaleFactor = 3, noiseProbability = 15, darkColor = "#000000", brightColor = "#ffffff", useOriginalColors = false, noiseSeed = 12345, scalingMode = 'shrink', shine = false, bwMode = 'threshold', ditherGamma = 1.0, saturationBoost = 0, zoomValue = 0, offsetXValue = 0, offsetYValue = 0, robustness = 50, add4thSquare = true) {
    try {
        // Step 1: Generate QR code without margin using direct pixel access
        const qr_noMargin = await getQRCodeImageData(text);

        // Step 2: Add 1 pixel margin
        const qr = addMargin(1, qr_noMargin);

        // Step 3: Generate mask for control squares and margin
        const qrCtrlMask = generateMask(qr, 1, 8, add4thSquare);

        // Step 4: Create QR with control squares (transparent where not masked)
        const qrCtrl = setWhereMasked(qr, qrCtrlMask, 0, 0, 0, 0, true);

        // Step 5: Scale up control squares by factor of 3
        const qrCtrlx3 = scale3Image(qrCtrl);

        // Step 6: Create QR without control squares (transparent where masked)
        const qrWithoutCtrl = setWhereMasked(qr, qrCtrlMask, 0, 0, 0, 0, false);

        // Step 7: Scale up by factor of 3
        const qrWithoutCtrlx3 = scale3Image(qrWithoutCtrl);

        // Step 6: Thin out by keeping only center pixels
        const qrWithoutCtrlThinned = onlyKeepCenterPixelOf9x9Block(qrWithoutCtrlx3);

        // Step 7: Scale uploaded image to match QR dimensions
        const scaledUploadedImage = scaleImageToDimensions(uploadedImage, qrWithoutCtrlThinned.width, qrWithoutCtrlThinned.height, scalingMode, zoomValue, offsetXValue, offsetYValue);

        // Step 7.5: Optionally apply gamma correction for dither mode
        let scaledUploadedImage_Gamma = null;
        let scaledUploadedImageBW;
        if (bwMode === 'dither') {
            // Apply brightness/contrast adjustment to grayscale before dithering
            // ditherGamma now ranges from -1 (darken, more contrast), 0 (no change), 1 (brighten, more contrast)
            scaledUploadedImage_Gamma = new ImageData(scaledUploadedImage.width, scaledUploadedImage.height);
            for (let i = 0; i < scaledUploadedImage.data.length; i += 4) {
                // Calculate grayscale value (luminance)
                const gray = scaledUploadedImage.data[i] * 0.299 + scaledUploadedImage.data[i + 1] * 0.587 + scaledUploadedImage.data[i + 2] * 0.114;
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
            scaledUploadedImageBW = convertToBlackAndWhite(scaledUploadedImage, threshold);
        }

        // Step 7.5.5: Add noise to black and white image
        const scaledUploadedImageBW_Noise = addNoiseToImage(scaledUploadedImageBW, noiseProbability, noiseSeed);

        // Step 7.6: Create BW image with control squares (using noisy image as base)
        const scaledUploadedImageBW_plusCtrl = new ImageData(scaledUploadedImageBW_Noise.width, scaledUploadedImageBW_Noise.height);
        const bwPlusCtrlData = scaledUploadedImageBW_plusCtrl.data;
        
        // Copy the noisy black and white image
        for (let i = 0; i < scaledUploadedImageBW_Noise.data.length; i++) {
            bwPlusCtrlData[i] = scaledUploadedImageBW_Noise.data[i];
        }
        
        // Overlay the control squares
        const qrCtrlx3Data = qrCtrlx3.data;
        for (let i = 0; i < qrCtrlx3Data.length; i += 4) {
            if (qrCtrlx3Data[i + 3] > 0) { // If pixel is not transparent
                bwPlusCtrlData[i] = qrCtrlx3Data[i];     // Red
                bwPlusCtrlData[i + 1] = qrCtrlx3Data[i + 1]; // Green
                bwPlusCtrlData[i + 2] = qrCtrlx3Data[i + 2]; // Blue
                bwPlusCtrlData[i + 3] = qrCtrlx3Data[i + 3]; // Alpha
            }
        }

        // Step 7.7: Create BW image with control squares and QR data
        const scaledUploadedImageBW_plusAllQR = new ImageData(scaledUploadedImageBW_plusCtrl.width, scaledUploadedImageBW_plusCtrl.height);
        const bwPlusAllQRData = scaledUploadedImageBW_plusAllQR.data;
        
        // Copy the BW image with control squares
        for (let i = 0; i < scaledUploadedImageBW_plusCtrl.data.length; i++) {
            bwPlusAllQRData[i] = scaledUploadedImageBW_plusCtrl.data[i];
        }
        
        // Overlay the thinned QR code data
        const qrWithoutCtrlThinnedData = qrWithoutCtrlThinned.data;
        for (let i = 0; i < qrWithoutCtrlThinnedData.length; i += 4) {
            if (qrWithoutCtrlThinnedData[i + 3] > 0) { // If pixel is not transparent
                bwPlusAllQRData[i] = qrWithoutCtrlThinnedData[i];     // Red
                bwPlusAllQRData[i + 1] = qrWithoutCtrlThinnedData[i + 1]; // Green
                bwPlusAllQRData[i + 2] = qrWithoutCtrlThinnedData[i + 2]; // Blue
                bwPlusAllQRData[i + 3] = qrWithoutCtrlThinnedData[i + 3]; // Alpha
            }
        }

        // Step 7.8: Apply colors to create colored result
        let result_colored;
        if (useOriginalColors) {
            result_colored = applyOriginalColors(scaledUploadedImageBW_plusAllQR, scaledUploadedImage, qrWithoutCtrlx3, saturationBoost, robustness);
        } else {
            result_colored = applyCustomColors(scaledUploadedImageBW_plusAllQR, darkColor, brightColor);
        }
        // Compute result_colored_shine before result_colored_xN
        let result_colored_shine = null;
        if (result_colored) {
            let preShine = result_colored;
            // If shine is enabled and darkColor is black and brightColor is white, gray the image a bit
            if (shine && darkColor.toLowerCase() === '#000000' && brightColor.toLowerCase() === '#ffffff') {
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
                result_colored_shine = overlayDiagonalGradient(preShine, '#35456c', '#fffea0');
            } else {
                result_colored_shine = new ImageData(new Uint8ClampedArray(preShine.data), preShine.width, preShine.height);
            }
        }
        // Step 7.9: Create scaled version of the colored result (from result_colored_shine)
        const result_colored_xN = result_colored_shine ? scaleImageByFactor(result_colored_shine, scaleFactor) : null;

        // Overlay a diagonal gradient on an ImageData
        function overlayDiagonalGradient(imageData, colorBL, colorTR) {
            const width = imageData.width;
            const height = imageData.height;
            const result = new ImageData(width, height);
            // Parse hex colors
            function hexToRgbArr(hex) {
                hex = hex.replace('#', '');
                return [
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                ];
            }
            const rgbBL = hexToRgbArr(colorBL);
            const rgbTR = hexToRgbArr(colorTR);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const t = ((x / (width - 1)) + (1 - y / (height - 1))) / 2; // 0 at BL, 1 at TR
                    const rG = Math.round(rgbBL[0] * (1 - t) + rgbTR[0] * t);
                    const gG = Math.round(rgbBL[1] * (1 - t) + rgbTR[1] * t);
                    const bG = Math.round(rgbBL[2] * (1 - t) + rgbTR[2] * t);
                    const idx = (y * width + x) * 4;
                    // Photoshop overlay blend mode
                    function overlayBlend(a, b) {
                        a /= 255; b /= 255;
                        return Math.round((a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b)) * 255);
                    }
                    result.data[idx] = overlayBlend(imageData.data[idx], rG);
                    result.data[idx + 1] = overlayBlend(imageData.data[idx + 1], gG);
                    result.data[idx + 2] = overlayBlend(imageData.data[idx + 2], bG);
                    result.data[idx + 3] = imageData.data[idx + 3];
                }
            }
            return result;
        }

        // Step 8: Create final canvas and overlay
        const canvas = document.getElementById('resultCanvas');
        const ctx = canvas.getContext('2d');
        
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
            // Add gamma debug image if present
            ...(scaledUploadedImage_Gamma ? { scaledUploadedImage_Gamma } : {})
        };

    } catch (error) {
        console.error('Error in QR code processing pipeline:', error);
        throw error;
    }
}

// Export for use in other modules
window.generateQRCodeOverlay = generateQRCodeOverlay; 