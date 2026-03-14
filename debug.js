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
})();
