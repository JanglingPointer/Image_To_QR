/**
 * Debug module - consolidates all debug UI logic.
 * Handles debug output logging, debug image rendering, and debug state.
 */
(function () {
  "use strict";

  // Mapping of debug canvas element IDs to debugData property keys
  const DEBUG_CANVAS_MAP = [
    { id: "debugQrNoMargin", key: "qr_noMargin" },
    { id: "debugQr", key: "qr" },
    { id: "debugQrCtrlMask", key: "qrCtrlMask" },
    { id: "debugQrCtrl", key: "qrCtrl" },
    { id: "debugQrCtrlx3", key: "qrCtrlx3" },
    { id: "debugQrWithoutCtrl", key: "qrWithoutCtrl" },
    { id: "debugQrWithoutCtrlx3", key: "qrWithoutCtrlx3" },
    { id: "debugQrWithoutCtrlThinned", key: "qrWithoutCtrlThinned" },
    { id: "debugScaledUploadedImage", key: "scaledUploadedImage" },
    { id: "debugScaledUploadedImage_Gamma", key: "scaledUploadedImage_Gamma" },
    { id: "debugScaledUploadedImageBW", key: "scaledUploadedImageBW" },
    { id: "debugScaledUploadedImageBW_Noise", key: "scaledUploadedImageBW_Noise" },
    {
      id: "debugScaledUploadedImageBW_plusCtrl",
      key: "scaledUploadedImageBW_plusCtrl",
    },
    {
      id: "debugScaledUploadedImageBW_plusAllQR",
      key: "scaledUploadedImageBW_plusAllQR",
    },
    { id: "debugResultColored", key: "result_colored" },
    { id: "debugResultColoredShine", key: "result_colored_shine" },
    { id: "debugResultColoredXN", key: "result_colored_xN" },
  ];

  /**
   * Log a message to the debug output textarea.
   * @param {string} message
   */
  function log(message) {
    const debugOutputText = document.getElementById("debugOutputText");
    if (debugOutputText) {
      const timestamp = new Date().toLocaleTimeString();
      debugOutputText.value += `[${timestamp}] ${message}\n`;
      debugOutputText.scrollTop = debugOutputText.scrollHeight;
    }
  }

  /**
   * Clear the debug output textarea.
   */
  function clear() {
    const debugOutputText = document.getElementById("debugOutputText");
    if (debugOutputText) {
      debugOutputText.value = "";
    }
  }

  /**
   * Render an ImageData to a debug canvas element.
   * Hides the parent .debug-image-item if imageData is null/undefined.
   * @param {HTMLCanvasElement} canvas
   * @param {ImageData|null|undefined} imageData
   */
  function renderDebugImage(canvas, imageData) {
    if (!canvas) return;
    const item = canvas.closest(".debug-image-item");
    if (imageData) {
      if (item) item.style.display = "";
      const ctx = canvas.getContext("2d");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
    } else {
      if (item) item.style.display = "none";
    }
  }

  /**
   * Render all debug images from debugData to their corresponding canvases.
   * @param {Object} debugData - Object returned from generateQRCodeOverlay
   */
  function renderAllDebugImages(debugData) {
    if (!debugData) return;
    for (const { id, key } of DEBUG_CANVAS_MAP) {
      const canvas = document.getElementById(id);
      renderDebugImage(canvas, debugData[key]);
    }
  }

  /**
   * Check if debug mode is enabled (debug checkbox is checked).
   * @returns {boolean}
   */
  function isEnabled() {
    const checkbox = document.getElementById("debugCheckbox");
    return checkbox ? checkbox.checked : false;
  }

  /**
   * Checks if a point is inside a triangle (barycentric test).
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @param {Object} triangle - {x1,y1,x2,y2,x3,y3}
   * @returns {boolean}
   */
  function isPointInTriangle(px, py, triangle) {
    const { x1, y1, x2, y2, x3, y3 } = triangle;
    const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;
    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }

  /**
   * Generates a random test image as a data URL (gradient background + random triangles).
   * Aspect ratio is random between 0.5 and 2.0.
   * @returns {string} Data URL of the generated image
   */
  function generateRandomTestImageDataUrl() {
    const aspect = 0.5 + Math.random() * 1.5;
    let width, height;
    if (aspect >= 1) {
      width = 256 * aspect;
      height = 256;
    } else {
      width = 256;
      height = 256 / aspect;
    }
    width = Math.round(width);
    height = Math.round(height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const bgGradient = {
      x1: Math.random() * width,
      y1: Math.random() * height,
      x2: Math.random() * width,
      y2: Math.random() * height,
      r1: Math.random() * 255,
      g1: Math.random() * 255,
      b1: Math.random() * 255,
      r2: Math.random() * 255,
      g2: Math.random() * 255,
      b2: Math.random() * 255,
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const dist =
          Math.abs(
            (bgGradient.y2 - bgGradient.y1) * x -
              (bgGradient.x2 - bgGradient.x1) * y +
              bgGradient.x2 * bgGradient.y1 -
              bgGradient.y2 * bgGradient.x1,
          ) /
          Math.sqrt(
            (bgGradient.y2 - bgGradient.y1) ** 2 +
              (bgGradient.x2 - bgGradient.x1) ** 2,
          );
        const blend = Math.sin(dist * 0.05) * 0.5 + 0.5;
        const r = Math.floor(
          bgGradient.r1 * (1 - blend) + bgGradient.r2 * blend,
        );
        const g = Math.floor(
          bgGradient.g1 * (1 - blend) + bgGradient.g2 * blend,
        );
        const b = Math.floor(
          bgGradient.b1 * (1 - blend) + bgGradient.b2 * blend,
        );
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }

    const triangles = [];
    for (let i = 0; i < 5; i++) {
      triangles.push({
        x1: Math.random() * width,
        y1: Math.random() * height,
        x2: Math.random() * width,
        y2: Math.random() * height,
        x3: Math.random() * width,
        y3: Math.random() * height,
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255,
      });
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        for (const triangle of triangles) {
          if (isPointInTriangle(x, y, triangle)) {
            data[index] = triangle.r;
            data[index + 1] = triangle.g;
            data[index + 2] = triangle.b;
            data[index + 3] = 255;
            break;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  // Expose API on window for use by ui-handlers and image-manipulation
  window.debugModule = {
    log,
    clear,
    renderDebugImage,
    renderAllDebugImages,
    isEnabled,
  };

  // Legacy global name for backwards compatibility (e.g. image-manipulation may call it)
  window.log_to_debug_output = log;

  window.generateRandomTestImageDataUrl = generateRandomTestImageDataUrl;
})();
