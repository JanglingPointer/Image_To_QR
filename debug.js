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
    { id: "debugComponentOklch", key: "component_oklch" },
    { id: "debugComponentHsb", key: "component_hsb" },
    { id: "debugComponentOverlay", key: "component_overlay" },
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
   * Clear the debug output textarea and hide all debug image slots until the next render.
   */
  function clear() {
    const debugOutputText = document.getElementById("debugOutputText");
    if (debugOutputText) {
      debugOutputText.value = "";
    }
    hideAllDebugImageItems();
  }

  /**
   * @param {ImageData|null|undefined} imageData
   * @returns {boolean}
   */
  function imageDataHasContent(imageData) {
    if (!imageData) return false;
    const w = imageData.width;
    const h = imageData.height;
    if (typeof w !== "number" || typeof h !== "number" || w <= 0 || h <= 0) {
      return false;
    }
    const data = imageData.data;
    const need = w * h * 4;
    return !!data && typeof data.length === "number" && data.length >= need;
  }

  function hideAllDebugImageItems() {
    for (const { id } of DEBUG_CANVAS_MAP) {
      const canvas = document.getElementById(id);
      if (!canvas) continue;
      const item = canvas.closest(".debug-image-item");
      if (item) item.style.display = "none";
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  /**
   * Render an ImageData to a debug canvas element.
   * Hides the parent .debug-image-item if there is no usable pixel data.
   * @param {HTMLCanvasElement} canvas
   * @param {ImageData|null|undefined} imageData
   */
  function renderDebugImage(canvas, imageData) {
    if (!canvas) return;
    const item = canvas.closest(".debug-image-item");
    if (imageDataHasContent(imageData)) {
      if (item) item.style.display = "";
      const ctx = canvas.getContext("2d");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
    } else {
      if (item) item.style.display = "none";
      canvas.width = 0;
      canvas.height = 0;
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

  const QR_OVERLAY_CTRL_CANVAS_ID = "debugQrCtrlx3";
  const QR_OVERLAY_THINNED_CANVAS_ID = "debugQrWithoutCtrlThinned";
  const QR_OVERLAY_BW_CANVAS_ID = "debugScaledUploadedImageBW";

  /**
   * True when both debug canvases have been rendered (non-zero size).
   * @returns {boolean}
   */
  function qrOverlaySourceCanvasesReady() {
    const c1 = document.getElementById(QR_OVERLAY_CTRL_CANVAS_ID);
    const c2 = document.getElementById(QR_OVERLAY_THINNED_CANVAS_ID);
    if (!c1 || !c2) return false;
    return (
      c1.width > 0 &&
      c1.height > 0 &&
      c2.width > 0 &&
      c2.height > 0
    );
  }

  /**
   * Enables or disables QR Overlay download buttons from current canvas state.
   */
  function syncQrOverlayDownloadButtonState() {
    const merged = document.getElementById("qrOverlayDownloadBtn");
    const separate = document.getElementById("qrOverlayDownloadSeparateBtn");
    const ready = qrOverlaySourceCanvasesReady();
    if (merged) merged.disabled = !ready;
    if (separate) separate.disabled = !ready;
  }

  /**
   * Composite qrCtrlx3 and qrWithoutCtrlThinned on a transparent canvas and download as Overlay.png.
   */
  function downloadQrOverlayPng() {
    const cCtrl = document.getElementById(QR_OVERLAY_CTRL_CANVAS_ID);
    const cThin = document.getElementById(QR_OVERLAY_THINNED_CANVAS_ID);
    if (!cCtrl || !cThin || !qrOverlaySourceCanvasesReady()) return;

    const w = Math.max(cCtrl.width, cThin.width);
    const h = Math.max(cCtrl.height, cThin.height);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(cCtrl, 0, 0);
    ctx.drawImage(cThin, 0, 0);

    try {
      Android.saveToGallery(out.toDataURL("image/png"), "Overlay.png");
    } catch (e) {
      try {
        const link = document.createElement("a");
        link.download = "Overlay.png";
        link.href = out.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e2) {
        console.error("QR Overlay export failed:", e2);
        alert("Failed to generate image");
      }
    }
  }

  /**
   * Download Noise, qrCtrlx3 (data pixels), and qrWithoutCtrlThinned (squares/border) as three PNG files.
   */
  function downloadQrOverlayLayersSeparatePng() {
    const cCtrl = document.getElementById(QR_OVERLAY_CTRL_CANVAS_ID);
    const cThin = document.getElementById(QR_OVERLAY_THINNED_CANVAS_ID);
    if (!cCtrl || !cThin || !qrOverlaySourceCanvasesReady()) return;

    function saveOne(canvas, filename) {
      try {
        Android.saveToGallery(canvas.toDataURL("image/png"), filename);
      } catch (e) {
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    function canvasToImageData(canvas) {
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function createOpaqueGrayImageData(width, height) {
      const imageData = new ImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 127;
        data[i + 1] = 127;
        data[i + 2] = 127;
        data[i + 3] = 255;
      }
      return imageData;
    }

    function buildNoiseCanvasForOverlayExport() {
      const noiseFactory = window.generateNoiseArtifacts;
      if (typeof noiseFactory !== "function") return null;

      const w = Math.max(cCtrl.width, cThin.width);
      const h = Math.max(cCtrl.height, cThin.height);
      if (w <= 0 || h <= 0) return null;

      const bwCanvas = document.getElementById(QR_OVERLAY_BW_CANVAS_ID);
      const hasInputImage = !!window.uploadedImage;
      const baseBw = hasInputImage
        ? canvasToImageData(bwCanvas)
        : createOpaqueGrayImageData(w, h);

      if (!baseBw) return null;

      const noiseProbability = hasInputImage
        ? parseInt((document.getElementById("noiseSlider") || {}).value, 10) || 0
        : 10;
      const seed =
        typeof window.noiseSeed === "number"
          ? window.noiseSeed
          : parseInt(window.noiseSeed, 10) || 54321;
      const colorfulMode = !!(
        document.getElementById("colorAppearanceColorful") || {}
      ).checked;
      const randomizePolarity = !hasInputImage || colorfulMode;
      const { noiseLayerImageData } = noiseFactory(
        baseBw,
        noiseProbability,
        seed,
        randomizePolarity,
      );

      const out = document.createElement("canvas");
      out.width = noiseLayerImageData.width;
      out.height = noiseLayerImageData.height;
      const ctx = out.getContext("2d");
      ctx.putImageData(noiseLayerImageData, 0, 0);
      return out;
    }

    saveOne(cCtrl, "Squares_And_Border.png");
    setTimeout(function () {
      saveOne(cThin, "Data_Pixels.png");
      const cNoise = buildNoiseCanvasForOverlayExport();
      if (!cNoise) return;
      setTimeout(function () {
        saveOne(cNoise, "Noise.png");
      }, 200);
    }, 200);
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
    syncQrOverlayDownloadButtonState,
    downloadQrOverlayPng,
    downloadQrOverlayLayersSeparatePng,
  };

  // Legacy global name for backwards compatibility (e.g. image-manipulation may call it)
  window.log_to_debug_output = log;

  window.generateRandomTestImageDataUrl = generateRandomTestImageDataUrl;

  hideAllDebugImageItems();
})();
