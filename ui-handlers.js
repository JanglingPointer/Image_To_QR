(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const textInput = document.getElementById("textInput");
  const previewImage = document.getElementById("previewImage");
  const resultSection = document.getElementById("resultSection");
  const testImageBtn = document.getElementById("testImageBtn");
  const debugCheckbox = document.getElementById("debugCheckbox");
  const debugSection = document.getElementById("debugSection");
  const debugQrNoMargin = document.getElementById("debugQrNoMargin");
  const debugQr = document.getElementById("debugQr");
  const debugQrCtrlMask = document.getElementById("debugQrCtrlMask");
  const debugQrCtrl = document.getElementById("debugQrCtrl");
  const debugQrCtrlx3 = document.getElementById("debugQrCtrlx3");
  const debugQrWithoutCtrl = document.getElementById("debugQrWithoutCtrl");
  const debugQrWithoutCtrlx3 = document.getElementById("debugQrWithoutCtrlx3");
  const debugQrWithoutCtrlThinned = document.getElementById(
    "debugQrWithoutCtrlThinned",
  );
  const debugScaledUploadedImage = document.getElementById(
    "debugScaledUploadedImage",
  );
  const debugScaledUploadedImageBW = document.getElementById(
    "debugScaledUploadedImageBW",
  );
  const debugScaledUploadedImageBW_plusCtrl = document.getElementById(
    "debugScaledUploadedImageBW_plusCtrl",
  );
  const debugScaledUploadedImageBW_plusAllQR = document.getElementById(
    "debugScaledUploadedImageBW_plusAllQR",
  );
  const thresholdSlider = document.getElementById("thresholdSlider");
  const thresholdValue = document.getElementById("thresholdValue");
  const thresholdControl = document.querySelector(".threshold-control");
  // Add DitherBrightness slider and value
  const ditherBrightnessSlider = document.getElementById(
    "ditherBrightnessSlider",
  );
  const ditherBrightnessValue = document.getElementById(
    "ditherBrightnessValue",
  );
  const claritySlider = document.getElementById("claritySlider");
  const clarityControl = document.querySelector(".clarity-control");
  const add4thSquareCheckbox = document.getElementById("add4thSquareCheckbox");
  const add4thSquareControl = document.querySelector(".add-4th-square-control");
  const debugScaledUploadedImage_Gamma = document.getElementById(
    "debugScaledUploadedImage_Gamma",
  );
  const scaleSlider = document.getElementById("scaleSlider");
  const scaleValue = document.getElementById("scaleValue");
  const scaleControl = document.querySelector(".scale-control");
  const noiseSlider = document.getElementById("noiseSlider");
  const noiseValue = document.getElementById("noiseValue");
  const noiseControl = document.querySelector(".noise-control");
  const colorDark = document.getElementById("colorDark");
  const colorBright = document.getElementById("colorBright");
  const colorControl = document.querySelector(".color-control");
  const originalColorsCheckbox = document.getElementById(
    "originalColorsCheckbox",
  );
  const customColorsSection = document.getElementById("customColorsSection");
  const debugResultColored = document.getElementById("debugResultColored");
  const debugResultColoredXN = document.getElementById("debugResultColoredXN");
  const debugScaledUploadedImageBW_Noise = document.getElementById(
    "debugScaledUploadedImageBW_Noise",
  );
  const scalingModeGroup = document.querySelector(".scaling-mode-group");
  const debugOutputText = document.getElementById("debugOutputText");
  const bwModeGroup = document.querySelector(".bw-mode-group");
  const mainImageControls = document.querySelector(".main-image-controls");
  const downloadBtn = document.getElementById("downloadBtn");
  // Add a reference to the new debug canvas
  const debugResultColoredShine = document.getElementById(
    "debugResultColoredShine",
  );
  const shineCheckbox = document.getElementById("shineCheckbox");
  const saturationBoostCheckbox = document.getElementById(
    "saturationBoostCheckbox",
  );
  const saturationBoostLabel = document.getElementById("saturationBoostLabel");
  const saturationBoostSlider = document.getElementById(
    "saturationBoostSlider",
  );
  const saturationBoostValue = document.getElementById("saturationBoostValue");
  const zoomSlider = document.getElementById("zoomSlider");
  const zoomValue = document.getElementById("zoomValue");
  const zoomControl = document.querySelector(".zoom-control");
  const offsetXSlider = document.getElementById("offsetXSlider");
  const offsetXValue = document.getElementById("offsetXValue");
  const offsetYSlider = document.getElementById("offsetYSlider");
  const offsetYValue = document.getElementById("offsetYValue");
  const blockSizeSlider = document.getElementById("blockSizeSlider");
  const blockSizeValue = document.getElementById("blockSizeValue");
  const pixelPerfectCheckbox = document.getElementById("pixelPerfectCheckbox");

  // Global variable to store the uploaded image
  window.uploadedImage = null;

  // Global variable for noise seed
  window.noiseSeed = 12345;

  // Function to log messages to debug output textarea
  function log_to_debug_output(message) {
    const debugOutputText = document.getElementById("debugOutputText");
    if (debugOutputText) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString();
      debugOutputText.value += `[${timestamp}] ${message}\n`;
      debugOutputText.scrollTop = debugOutputText.scrollHeight;
    }
  }

  // Make the function available globally
  window.log_to_debug_output = log_to_debug_output;

  // Utility functions to reduce code duplication
  const utils = {
    // Show/hide elements with proper display values
    show: (element) => element && (element.style.display = "block"),
    hide: (element) => element && (element.style.display = "none"),
    showInline: (element) => element && (element.style.display = "inline-flex"),
    showFlex: (element) => element && (element.style.display = "flex"),

    // Remove CSS class and set proper display
    removeHiddenClass: (element, displayType = "block") => {
      if (element) {
        element.classList.remove("hidden");
        element.style.display = displayType;
      }
    },

    // Add hidden class and hide element
    addHiddenClass: (element) => {
      if (element) {
        element.classList.add("hidden");
      }
    },

    // Add event listener with updateResult callback
    addUpdateListener: (element, eventType = "input") => {
      if (element) {
        element.addEventListener(eventType, () => {
          if (window.uploadedImage) {
            updateResult();
          }
        });
      }
    },

    // Add event listener for radio buttons
    addRadioListener: (elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener("change", () => {
          if (window.uploadedImage) {
            updateResult();
          }
        });
      }
    },

    // Update slider value display
    updateSliderValue: (slider, valueElement, formatter = (val) => val) => {
      if (slider && valueElement) {
        valueElement.textContent = formatter(slider.value);
      }
    },

    // Add slider event listener with value update
    addSliderListener: (slider, valueElement, formatter = (val) => val) => {
      if (slider && valueElement) {
        slider.addEventListener("input", function () {
          utils.updateSliderValue(this, valueElement, formatter);
          if (window.uploadedImage) {
            updateResult();
          }
        });
        // Set initial value
        utils.updateSliderValue(slider, valueElement, formatter);
      }
    },
  };

  // Centralized initial settings
  const initialSettings = {
    text: "https://example.com#enter_your_own_URL",
    bwMode: "dither", // 'threshold' | 'dither' | 'original'
    blockSize: 1, // 1-8 for pixel art mode
    threshold: 128,
    ditherBrightness: 0, // -1..1
    clarity: 0, // 0..100
    add4thSquare: true, // Whether to add 4th square
    scale: 3,
    noise: 10,
    colorDark: "#211e59",
    colorBright: "#f9f7dd",
    originalColors: true,
    saturationBoost: 0.3,
    shine: false,
    scalingMode: "grow", // 'shrink' | 'grow' | 'stretch' | 'custom'
    zoom: 0,
    offsetX: 0,
    offsetY: 0,
    outsidePixels: "auto", // 'auto' | 'extend' | 'color'
    outsidePixelsColor: "#000000",
    debug: false,
    pixelPerfect: false, // New setting for pixel perfect mode
  };

  function setOriginalColorsState(useOriginalColors) {
    // Set checkbox state: checked = duo tone mode, unchecked = original colors mode
    originalColorsCheckbox.checked = !useOriginalColors;
    const saturationBoostGroup = document.querySelector(
      ".saturation-boost-group",
    );
    // Show/hide UI elements based on mode
    if (useOriginalColors) {
      // Original colors mode: hide color pickers, show saturation boost
      utils.addHiddenClass(customColorsSection);
      utils.removeHiddenClass(saturationBoostGroup, "flex");
    } else {
      // Duo tone mode: show color pickers, hide saturation boost
      utils.removeHiddenClass(customColorsSection, "flex");
      utils.addHiddenClass(saturationBoostGroup);
    }
  }

  function applySettingsToUI(settings) {
    // Text
    if (textInput) textInput.value = settings.text;
    // BW Mode radios
    const bwThreshold = document.getElementById("bwModeThreshold");
    const bwDither = document.getElementById("bwModeDither");
    const bwPixelArt = document.getElementById("bwModePixelArt");
    if (bwThreshold && bwDither && bwPixelArt) {
      bwThreshold.checked = settings.bwMode === "threshold";
      bwDither.checked = settings.bwMode === "dither";
      bwPixelArt.checked = settings.bwMode === "original";
    }
    // Sliders and labels
    if (thresholdSlider) thresholdSlider.value = String(settings.threshold);
    if (ditherBrightnessSlider)
      ditherBrightnessSlider.value = String(settings.ditherBrightness);
    if (claritySlider) claritySlider.value = String(settings.clarity);
    if (add4thSquareCheckbox)
      add4thSquareCheckbox.checked = settings.add4thSquare;
    if (scaleSlider) scaleSlider.value = String(settings.scale);
    if (noiseSlider) noiseSlider.value = String(settings.noise);
    if (saturationBoostSlider)
      saturationBoostSlider.value =
        settings.bwMode === "original" ? "0" : String(settings.saturationBoost);
    if (zoomSlider) zoomSlider.value = String(settings.zoom);
    if (offsetXSlider) offsetXSlider.value = String(settings.offsetX);
    if (offsetYSlider) offsetYSlider.value = String(settings.offsetY);
    if (blockSizeSlider) blockSizeSlider.value = String(settings.blockSize);
    if (pixelPerfectCheckbox)
      pixelPerfectCheckbox.checked = settings.pixelPerfect;
    // Color pickers
    if (colorDark) {
      colorDark.value = settings.colorDark;
      validateColorRange(colorDark, true);
    }
    if (colorBright) {
      colorBright.value = settings.colorBright;
      validateColorRange(colorBright, false);
    }
    // Original colors toggle and dependent UI
    setOriginalColorsState(settings.originalColors);
    // Shine
    const shineCb = document.getElementById("shineCheckbox");
    if (shineCb) shineCb.checked = settings.shine;
    // Scaling mode radios
    const shrinkRadio = document.getElementById("scalingModeShrink");
    const growRadio = document.getElementById("scalingModeGrow");
    const stretchRadio = document.getElementById("scalingModeStretch");
    const customRadio = document.getElementById("scalingModeCustom");
    if (shrinkRadio && growRadio && stretchRadio && customRadio) {
      shrinkRadio.checked = settings.scalingMode === "shrink";
      growRadio.checked = settings.scalingMode === "grow";
      stretchRadio.checked = settings.scalingMode === "stretch";
      customRadio.checked = settings.scalingMode === "custom";
    }
    // Outside Pixels radios and color picker
    const outsidePixelsAutoEl = document.getElementById("outsidePixelsAuto");
    const outsidePixelsExtendEl = document.getElementById(
      "outsidePixelsExtend",
    );
    const outsidePixelsColorEl = document.getElementById("outsidePixelsColor");
    const outsidePixelsColorPickerEl = document.getElementById(
      "outsidePixelsColorPicker",
    );
    if (outsidePixelsAutoEl)
      outsidePixelsAutoEl.checked = settings.outsidePixels === "auto";
    if (outsidePixelsExtendEl)
      outsidePixelsExtendEl.checked = settings.outsidePixels === "extend";
    if (outsidePixelsColorEl)
      outsidePixelsColorEl.checked = settings.outsidePixels === "color";
    if (outsidePixelsColorPickerEl)
      outsidePixelsColorPickerEl.value =
        settings.outsidePixelsColor || "#000000";
    // Debug checkbox and dependent UI
    if (debugCheckbox) debugCheckbox.checked = settings.debug;
    if (settings.debug) {
      utils.removeHiddenClass(testImageBtn);
    } else {
      utils.addHiddenClass(testImageBtn);
    }
    // Update computed UI visibility
    updateDitherBrightnessVisibility();
    updateZoomControlVisibility();
    updateClarityVisibility();
    // Initially hide main image controls until image is uploaded
    utils.addHiddenClass(mainImageControls);
    // Ensure slider value labels reflect current values
    utils.updateSliderValue(thresholdSlider, thresholdValue);
    utils.updateSliderValue(scaleSlider, scaleValue);
    utils.updateSliderValue(noiseSlider, noiseValue);
    // saturationBoostValue element was removed, so no need to update it
    utils.updateSliderValue(zoomSlider, zoomValue, (v) =>
      parseFloat(v).toFixed(2),
    );
    utils.updateSliderValue(offsetXSlider, offsetXValue, (v) =>
      parseFloat(v).toFixed(2),
    );
    utils.updateSliderValue(offsetYSlider, offsetYValue, (v) =>
      parseFloat(v).toFixed(2),
    );
    utils.updateSliderValue(blockSizeSlider, blockSizeValue);
  }

  // Calculate average pixel value of an image
  function calculateAveragePixelValue(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalValue = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value (luminance)
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      totalValue += gray;
      pixelCount++;
    }

    return totalValue / pixelCount;
  }

  // Auto-compute block size when Pixel Perfect is active
  function autoComputeBlockSize() {
    if (!window.uploadedImage || !blockSizeSlider || !blockSizeValue) return;
    if (!pixelPerfectCheckbox || !pixelPerfectCheckbox.checked) return;
    const blockSize = window.computeBlockSizeFromImage(window.uploadedImage);
    blockSizeSlider.value = String(blockSize);
    blockSizeValue.textContent = String(blockSize);
  }

  // Auto-adjust threshold based on image
  function autoAdjustThreshold(image) {
    const averagePixelValue = calculateAveragePixelValue(image);
    const newThreshold = Math.round(averagePixelValue);
    thresholdSlider.value = newThreshold;
    thresholdValue.textContent = newThreshold;
  }

  // Handle auto block size button click
  function handleAutoBlockSize() {
    if (!window.uploadedImage || !blockSizeSlider || !blockSizeValue) return;
    const blockSize = window.computeBlockSizeFromImage(window.uploadedImage);
    blockSizeSlider.value = String(blockSize);
    blockSizeValue.textContent = String(blockSize);
    if (window.uploadedImage) {
      updateResult();
    }
  }

  // Handle file upload
  imageInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const originalSrc = e.target.result;
        const img = new Image();
        img.onload = function () {
          // Downscale once if both dimensions exceed 1200 so that min(newW,newH)=1200
          let finalSrc = originalSrc;
          if (img.width > 1200 && img.height > 1200) {
            const scale = 1200 / Math.min(img.width, img.height);
            const newWidth = Math.round(img.width * scale);
            const newHeight = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            finalSrc = canvas.toDataURL();
          }
          const scaledImage = new Image();
          scaledImage.onload = function () {
            window.uploadedImage = scaledImage;
            previewImage.src = finalSrc;
            utils.removeHiddenClass(previewImage);
            document.querySelector(".file-input-text").style.display = "none";
            utils.removeHiddenClass(mainImageControls);
            utils.removeHiddenClass(scaleControl);
            utils.removeHiddenClass(noiseControl);
            utils.removeHiddenClass(colorControl);
            utils.removeHiddenClass(scalingModeGroup, "flex");
            utils.removeHiddenClass(bwModeGroup);

            autoAdjustThreshold(window.uploadedImage);
            autoComputeBlockSize();
            updateDitherBrightnessVisibility();
            updateZoomControlVisibility();
            updateResult();
          };
          scaledImage.src = finalSrc;
        };
        img.src = originalSrc;
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle drag and drop
  const fileInputWrapper = document.querySelector(".file-input-wrapper");

  fileInputWrapper.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.style.borderColor = "#667eea";
    this.style.background = "#f0f4ff";
  });

  fileInputWrapper.addEventListener("dragleave", function (e) {
    e.preventDefault();
    this.style.borderColor = "#dee2e6";
    this.style.background = "#f8f9fa";
  });

  fileInputWrapper.addEventListener("drop", function (e) {
    e.preventDefault();
    this.style.borderColor = "#dee2e6";
    this.style.background = "#f8f9fa";

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      imageInput.files = files;
      imageInput.dispatchEvent(new Event("change"));
    }
  });

  // Handle text input
  textInput.addEventListener("input", updateResult);

  // Handle text input focus to clear default value
  textInput.addEventListener("focus", function () {
    if (this.value === this.placeholder) {
      this.value = "";
    }
  });

  // Handle text input blur to restore default if empty
  textInput.addEventListener("blur", function () {
    if (this.value.trim() === "") {
      this.value = this.placeholder;
    }
  });

  // Generate test image function
  function generateTestImage() {
    // Random aspect ratio between 0.5 and 2.0
    const aspect = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
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
    // Create random gradient background
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    // Generate random gradient parameters for background
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
    // Create background gradient
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        // Calculate distance from gradient line
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
        // Create gradient pattern
        const blend = Math.sin(dist * 0.05) * 0.5 + 0.5;
        // Interpolate background colors
        const r = Math.floor(
          bgGradient.r1 * (1 - blend) + bgGradient.r2 * blend,
        );
        const g = Math.floor(
          bgGradient.g1 * (1 - blend) + bgGradient.g2 * blend,
        );
        const b = Math.floor(
          bgGradient.b1 * (1 - blend) + bgGradient.b2 * blend,
        );
        data[index] = r; // Red
        data[index + 1] = g; // Green
        data[index + 2] = b; // Blue
        data[index + 3] = 255; // Alpha
      }
    }
    // Generate 5 random triangles
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
    // Draw triangles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        // Check if point is inside any triangle
        for (const triangle of triangles) {
          if (isPointInTriangle(x, y, triangle)) {
            data[index] = triangle.r; // Red
            data[index + 1] = triangle.g; // Green
            data[index + 2] = triangle.b; // Blue
            data[index + 3] = 255; // Alpha
            break; // Only use the first triangle that contains this point
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    // Convert to image
    const testImage = new Image();
    testImage.onload = function () {
      window.uploadedImage = testImage;
      previewImage.src = canvas.toDataURL();
      utils.removeHiddenClass(previewImage);
      document.querySelector(".file-input-text").style.display = "none";
      utils.removeHiddenClass(mainImageControls);
      utils.removeHiddenClass(scaleControl);
      utils.removeHiddenClass(noiseControl);
      utils.removeHiddenClass(colorControl);
      utils.removeHiddenClass(scalingModeGroup, "flex");
      utils.removeHiddenClass(bwModeGroup);
      autoAdjustThreshold(window.uploadedImage);
      autoComputeBlockSize();
      updateDitherBrightnessVisibility();
      updateZoomControlVisibility();
      updateResult();
    };
    testImage.src = canvas.toDataURL();
  }

  // Helper function to check if a point is inside a triangle
  function isPointInTriangle(px, py, triangle) {
    const { x1, y1, x2, y2, x3, y3 } = triangle;

    // Calculate barycentric coordinates
    const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;

    // Point is inside if all barycentric coordinates are between 0 and 1
    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }

  // Handle test image button
  testImageBtn.addEventListener("click", generateTestImage);

  // Function to update clarity control visibility
  function updateClarityVisibility() {
    const debugChecked = debugCheckbox && debugCheckbox.checked;
    const duoToneSelected =
      originalColorsCheckbox && originalColorsCheckbox.checked;
    // Show clarity when debug is checked AND duo tone is NOT selected
    if (debugChecked && !duoToneSelected) {
      if (clarityControl) utils.removeHiddenClass(clarityControl);
    } else {
      if (clarityControl) utils.addHiddenClass(clarityControl);
    }
  }

  // Handle debug checkbox
  debugCheckbox.addEventListener("change", function () {
    if (this.checked) {
      utils.removeHiddenClass(debugSection);
      utils.removeHiddenClass(testImageBtn);
      utils.removeHiddenClass(add4thSquareControl);
      if (window.uploadedImage) {
        updateResult();
      }
    } else {
      utils.addHiddenClass(debugSection);
      utils.addHiddenClass(testImageBtn);
      utils.addHiddenClass(add4thSquareControl);
    }
    updateClarityVisibility();
  });

  // Add slider listeners using utility function
  utils.addSliderListener(thresholdSlider, thresholdValue);
  utils.addSliderListener(scaleSlider, scaleValue);
  utils.addSliderListener(noiseSlider, noiseValue);

  // Add event listener for noise seed button
  const noiseSeedBtn = document.getElementById("noiseSeedBtn");
  noiseSeedBtn.addEventListener("click", function () {
    // Change the global noise seed to a new random value
    window.noiseSeed = Math.floor(Math.random() * 1000000000);
    if (window.uploadedImage) {
      updateResult();
    }
  });

  // Function to calculate luminance from hex color
  function calculateLuminance(hexColor) {
    // Convert hex to RGB
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const toLinear = (c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    // Calculate relative luminance (0-1)
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  // Function to validate color and apply red border if out of range
  function validateColorRange(colorInput, isDark) {
    const luminance = calculateLuminance(colorInput.value);
    const isValidRange = isDark ? luminance <= 0.3 : luminance >= 0.7;

    if (isValidRange) {
      colorInput.style.border = "";
    } else {
      colorInput.style.border = "2px solid red";
    }
  }

  // Simple throttling without event listener removal
  if (typeof window.isColorUpdateInProgress === "undefined") {
    window.isColorUpdateInProgress = false;
  }

  const colorInputHandler = function () {
    validateColorRange(this, this === colorDark); // validate immediately

    if (!window.uploadedImage || window.isColorUpdateInProgress) {
      return;
    }

    window.isColorUpdateInProgress = true;

    // Use setTimeout to break out of the current event loop
    setTimeout(async () => {
      try {
        await updateResult();
      } catch (error) {
        console.error("Update result error:", error);
      } finally {
        window.isColorUpdateInProgress = false;
      }
    }, 0);
  };

  // Add color picker event listeners
  colorDark.addEventListener("input", colorInputHandler);
  colorBright.addEventListener("input", colorInputHandler);

  // Handle download button
  downloadBtn.addEventListener("click", function () {
    const canvas = document.getElementById("resultCanvas");
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      try {
        // For App Usage
        Android.saveToGallery(canvas.toDataURL("image/png"), "QRCode.png");
      } catch (e) {
        try {
          // For Web Usage
          const link = document.createElement("a");
          link.download = "QRCode.png";
          link.href = canvas.toDataURL("image/png");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error("Canvas export failed:", e);
          alert("Failed to generate image");
        }
      }
    }
  });

  // Handle duo tone checkbox (inverted logic from original colors)
  originalColorsCheckbox.addEventListener("change", function () {
    const saturationBoostGroup = document.querySelector(
      ".saturation-boost-group",
    );
    // Inverted logic: checked = duo tone mode (show color pickers), unchecked = original colors mode
    if (this.checked) {
      utils.removeHiddenClass(customColorsSection, "flex");
      utils.addHiddenClass(saturationBoostGroup);
    } else {
      utils.addHiddenClass(customColorsSection);
      utils.removeHiddenClass(saturationBoostGroup, "flex");
    }
    updateClarityVisibility();
    if (window.uploadedImage) {
      updateResult();
    }
  });

  // On page load, apply centralized initial settings to ensure UI matches defaults
  applySettingsToUI(initialSettings);

  function formatSaturationValue(val) {
    return parseFloat(val).toFixed(2);
  }

  // Handle saturation boost slider
  if (saturationBoostSlider) {
    saturationBoostSlider.addEventListener("input", function () {
      if (window.uploadedImage) {
        updateResult();
      }
    });
  }

  // On page load, set testImageBtn and add4thSquare visibility based on debugCheckbox
  if (debugCheckbox.checked) {
    utils.removeHiddenClass(testImageBtn);
    utils.removeHiddenClass(add4thSquareControl);
  } else {
    utils.addHiddenClass(testImageBtn);
    utils.addHiddenClass(add4thSquareControl);
  }

  // Hide image controls when no image is present
  function hideImageUI() {
    utils.addHiddenClass(previewImage);
    document.querySelector(".file-input-text").style.display = "block";
    utils.addHiddenClass(mainImageControls);
    utils.addHiddenClass(scalingModeGroup);
    utils.addHiddenClass(zoomControl);
  }

  // Update result automatically when image or text changes
  async function updateResult() {
    // Clear debug output at the beginning of each recalculation
    const debugOutputText = document.getElementById("debugOutputText");
    if (debugOutputText) {
      debugOutputText.value = "";
    }

    if (!window.uploadedImage) {
      utils.addHiddenClass(resultSection);
      if (debugCheckbox.checked) {
        utils.addHiddenClass(debugSection);
      }
      hideImageUI(); // Hide scaling mode group if no image
      return;
    }

    const textValue = textInput.value.trim();

    // Use fallback string "." if text is empty or whitespace-only
    let textToUse = textValue;
    if (!textToUse || textToUse.length === 0) {
      textToUse = ".";
    } else if (textToUse === textInput.placeholder) {
      textToUse = textInput.placeholder;
    }

    try {
      const threshold = parseInt(thresholdSlider.value);
      const scaleFactor = parseInt(scaleSlider.value);
      const noiseProbability = parseInt(noiseSlider.value);
      const darkColor = colorDark.value;
      const brightColor = colorBright.value;
      const useOriginalColors = !originalColorsCheckbox.checked; // Inverted: unchecked = original colors
      const saturationBoost = useOriginalColors
        ? parseFloat(saturationBoostSlider.value)
        : 0;
      const noiseSeed = window.noiseSeed;
      // Get scaling mode
      let scalingMode = "shrink";
      const shrinkRadio = document.getElementById("scalingModeShrink");
      const growRadio = document.getElementById("scalingModeGrow");
      const stretchRadio = document.getElementById("scalingModeStretch");
      const customRadio = document.getElementById("scalingModeCustom");
      if (growRadio && growRadio.checked) scalingMode = "grow";
      if (stretchRadio && stretchRadio.checked) scalingMode = "stretch";
      if (customRadio && customRadio.checked) scalingMode = "custom";

      // Get zoom or blockSize value for custom mode based on pixel perfect setting
      let zoomValue = 0;
      let blockSize = 1;
      if (customRadio && customRadio.checked) {
        if (pixelPerfectCheckbox && pixelPerfectCheckbox.checked) {
          // Pixel perfect mode: use blockSize
          zoomValue = 0;
          blockSize = parseInt(blockSizeSlider.value, 10);
        } else {
          // Normal mode: use zoom
          zoomValue = parseFloat(zoomSlider.value);
          blockSize = 1;
        }
      }

      // Get offset values for custom mode
      const offsetXValue =
        customRadio && customRadio.checked
          ? parseFloat(offsetXSlider.value)
          : 0;
      const offsetYValue =
        customRadio && customRadio.checked
          ? parseFloat(offsetYSlider.value)
          : 0;
      // In updateResult, get the shine checkbox state and pass it to generateQRCodeOverlay
      const shineCheckbox = document.getElementById("shineCheckbox");
      const shine = shineCheckbox && shineCheckbox.checked;
      // In updateResult, get the selected black & white mode and pass it to generateQRCodeOverlay
      const bwMode = document.getElementById("bwModePixelArt").checked
        ? "original"
        : document.getElementById("bwModeDither").checked
          ? "dither"
          : "threshold";
      let ditherGamma = 1.0;
      if (bwMode === "dither" && ditherBrightnessSlider) {
        ditherGamma = parseFloat(ditherBrightnessSlider.value);
      }
      const clarity = claritySlider ? parseFloat(claritySlider.value) : 0;
      const add4thSquare = add4thSquareCheckbox
        ? add4thSquareCheckbox.checked
        : true;
      // blockSize already declared above, no need to redeclare
      const outsidePixelsExtend = document.getElementById(
        "outsidePixelsExtend",
      );
      const outsidePixelsColorRadio =
        document.getElementById("outsidePixelsColor");
      const outsidePixelsColorPicker = document.getElementById(
        "outsidePixelsColorPicker",
      );
      let outsidePixels = "auto";
      if (outsidePixelsExtend && outsidePixelsExtend.checked)
        outsidePixels = "extend";
      else if (outsidePixelsColorRadio && outsidePixelsColorRadio.checked)
        outsidePixels = "color";
      const outsidePixelsColor =
        outsidePixelsColorPicker && outsidePixels === "color"
          ? outsidePixelsColorPicker.value
          : "#000000";
      const useHsl = hslCheckbox && hslCheckbox.checked;
      const debugData = await generateQRCodeOverlay(
        window.uploadedImage,
        textToUse,
        threshold,
        scaleFactor,
        noiseProbability,
        darkColor,
        brightColor,
        useOriginalColors,
        noiseSeed,
        scalingMode,
        shine,
        bwMode,
        ditherGamma,
        saturationBoost,
        zoomValue,
        offsetXValue,
        offsetYValue,
        clarity,
        add4thSquare,
        blockSize,
        outsidePixels,
        outsidePixelsColor,
        useHsl,
        zoomValue,
      );
      utils.removeHiddenClass(resultSection, "flex");

      // Handle debug output
      if (debugCheckbox.checked && debugData) {
        utils.removeHiddenClass(debugSection, "flex");

        function renderDebugImage(canvas, imageData) {
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

        renderDebugImage(debugQrNoMargin, debugData.qr_noMargin);
        renderDebugImage(debugQr, debugData.qr);
        renderDebugImage(debugQrCtrlMask, debugData.qrCtrlMask);
        renderDebugImage(debugQrCtrl, debugData.qrCtrl);
        renderDebugImage(debugQrCtrlx3, debugData.qrCtrlx3);
        renderDebugImage(debugQrWithoutCtrl, debugData.qrWithoutCtrl);
        renderDebugImage(debugQrWithoutCtrlx3, debugData.qrWithoutCtrlx3);
        renderDebugImage(
          debugQrWithoutCtrlThinned,
          debugData.qrWithoutCtrlThinned,
        );
        renderDebugImage(
          debugScaledUploadedImage,
          debugData.scaledUploadedImage,
        );
        renderDebugImage(
          debugScaledUploadedImage_Gamma,
          debugData.scaledUploadedImage_Gamma,
        );
        renderDebugImage(
          debugScaledUploadedImageBW,
          debugData.scaledUploadedImageBW,
        );
        renderDebugImage(
          debugScaledUploadedImageBW_Noise,
          debugData.scaledUploadedImageBW_Noise,
        );
        renderDebugImage(
          debugScaledUploadedImageBW_plusCtrl,
          debugData.scaledUploadedImageBW_plusCtrl,
        );
        renderDebugImage(
          debugScaledUploadedImageBW_plusAllQR,
          debugData.scaledUploadedImageBW_plusAllQR,
        );
        renderDebugImage(debugResultColored, debugData.result_colored);
        renderDebugImage(
          debugResultColoredShine,
          debugData.result_colored_shine,
        );
        renderDebugImage(debugResultColoredXN, debugData.result_colored_xN);
      } else {
        utils.addHiddenClass(debugSection);
      }

      // Log input and output dimensions at the end of successful update
      if (window.uploadedImage && debugData && debugData.result_colored_xN) {
        const inputWidth = window.uploadedImage.width;
        const inputHeight = window.uploadedImage.height;
        const outputWidth = debugData.result_colored_xN.width;
        const outputHeight = debugData.result_colored_xN.height;
        log_to_debug_output(
          `Input: ${inputWidth}x${inputHeight}, Output: ${outputWidth}x${outputHeight}`,
        );
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      utils.addHiddenClass(resultSection);
      utils.addHiddenClass(debugSection);
    }
  }

  // Add event listeners to scaling mode radio buttons to trigger updateResult
  ["scalingModeShrink", "scalingModeGrow", "scalingModeStretch"].forEach(
    function (id) {
      utils.addRadioListener(id);
    },
  );

  // Add event listeners to Outside Pixels radio buttons and color picker
  ["outsidePixelsAuto", "outsidePixelsExtend", "outsidePixelsColor"].forEach(
    function (id) {
      utils.addRadioListener(id);
    },
  );
  if (document.getElementById("outsidePixelsColorPicker")) {
    utils.addUpdateListener(
      document.getElementById("outsidePixelsColorPicker"),
    );
  }

  // Function to update outside pixels color picker visibility
  function updateOutsidePixelsColorPickerVisibility() {
    const colorRadio = document.getElementById("outsidePixelsColor");
    const colorPickerDiv = document.querySelector(
      ".outside-pixels-color-picker",
    );
    if (colorRadio && colorPickerDiv) {
      if (colorRadio.checked) {
        utils.removeHiddenClass(colorPickerDiv, "flex");
      } else {
        utils.addHiddenClass(colorPickerDiv);
      }
    }
  }

  // Add event listeners to outside pixels radio buttons to toggle color picker visibility
  ["outsidePixelsAuto", "outsidePixelsExtend", "outsidePixelsColor"].forEach(
    function (id) {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(
          "change",
          updateOutsidePixelsColorPickerVisibility,
        );
      }
    },
  );

  // Initialize color picker visibility on page load
  updateOutsidePixelsColorPickerVisibility();

  shineCheckbox.addEventListener("change", function () {
    if (window.uploadedImage) {
      updateResult();
    }
  });

  const hslCheckbox = document.getElementById("hslCheckbox");
  hslCheckbox.addEventListener("change", function () {
    if (window.uploadedImage) {
      updateResult();
    }
  });

  // Add event listener to pixel perfect checkbox
  if (pixelPerfectCheckbox) {
    pixelPerfectCheckbox.addEventListener("change", function () {
      updateScalingModeRadioButtons();
      updateScalingModeAndZoomVisibility();
      if (window.uploadedImage) {
        updateResult();
      }
    });
  }

  // Add event listeners to black & white mode radio buttons to trigger updateResult
  ["bwModeThreshold", "bwModeDither", "bwModePixelArt"].forEach(function (id) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", () => {
        if (id === "bwModePixelArt" && saturationBoostSlider) {
          saturationBoostSlider.value = "0";
        }
        updateDitherBrightnessVisibility();
        updateZoomControlVisibility();
        if (window.uploadedImage) {
          updateResult();
        }
      });
    }
  });

  // Show/hide DitherBrightness slider based on BW mode
  function updateDitherBrightnessVisibility() {
    const ditherRadio = document.getElementById("bwModeDither");
    const thresholdRadio = document.getElementById("bwModeThreshold");
    const thresholdSliderDiv = thresholdSlider
      ? thresholdSlider.parentElement.parentElement
      : null;
    const ditherSliderDiv = ditherBrightnessSlider
      ? ditherBrightnessSlider.parentElement.parentElement
      : null;

    if (thresholdControl) utils.removeHiddenClass(thresholdControl);
    if (ditherRadio && ditherRadio.checked) {
      if (ditherSliderDiv) utils.removeHiddenClass(ditherSliderDiv);
      if (thresholdSliderDiv) utils.addHiddenClass(thresholdSliderDiv);
    } else if (thresholdRadio && thresholdRadio.checked) {
      if (thresholdSliderDiv) utils.removeHiddenClass(thresholdSliderDiv);
      if (ditherSliderDiv) utils.addHiddenClass(ditherSliderDiv);
    }
  }
  // On page load, set initial visibility
  updateDitherBrightnessVisibility();
  // DitherBrightness slider event
  if (ditherBrightnessSlider) {
    ditherBrightnessSlider.addEventListener("input", function () {
      if (window.uploadedImage) {
        updateResult();
      }
    });
  }

  // Block Size slider (Original mode)
  utils.addSliderListener(blockSizeSlider, blockSizeValue);

  // Auto block size button
  const autoBlockSizeBtn = document.getElementById("autoBlockSizeBtn");
  if (autoBlockSizeBtn) {
    autoBlockSizeBtn.addEventListener("click", handleAutoBlockSize);
  }

  // Clarity slider event
  if (claritySlider) {
    claritySlider.addEventListener("input", function () {
      if (window.uploadedImage) {
        updateResult();
      }
    });
  }

  // Add 4th Square checkbox event
  if (add4thSquareCheckbox) {
    add4thSquareCheckbox.addEventListener("change", function () {
      if (window.uploadedImage) {
        updateResult();
      }
    });
  }

  // Handle scaling mode radio buttons
  document.querySelectorAll('input[name="scalingMode"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      updateScalingModeAndZoomVisibility();
      if (window.uploadedImage) {
        updateResult();
      }
    });
  });

  const zoomSliderWrapper = document.getElementById("zoomSliderWrapper");

  // Function to update scaling mode radio buttons based on pixel perfect setting
  function updateScalingModeRadioButtons() {
    const shrinkRadio = document.getElementById("scalingModeShrink");
    const growRadio = document.getElementById("scalingModeGrow");
    const stretchRadio = document.getElementById("scalingModeStretch");
    const customRadio = document.getElementById("scalingModeCustom");

    if (pixelPerfectCheckbox && pixelPerfectCheckbox.checked) {
      // Pixel perfect mode: only Custom should be available and selected
      if (shrinkRadio) {
        shrinkRadio.disabled = true;
        shrinkRadio.parentElement.style.opacity = "0.5";
        shrinkRadio.parentElement.style.cursor = "not-allowed";
      }
      if (growRadio) {
        growRadio.disabled = true;
        growRadio.parentElement.style.opacity = "0.5";
        growRadio.parentElement.style.cursor = "not-allowed";
      }
      if (stretchRadio) {
        stretchRadio.disabled = true;
        stretchRadio.parentElement.style.opacity = "0.5";
        stretchRadio.parentElement.style.cursor = "not-allowed";
      }
      if (customRadio) {
        customRadio.disabled = false;
        customRadio.checked = true;
        customRadio.parentElement.style.opacity = "1";
        customRadio.parentElement.style.cursor = "";
      }
    } else {
      // Normal mode: all radio buttons available
      if (shrinkRadio) {
        shrinkRadio.disabled = false;
        shrinkRadio.parentElement.style.opacity = "1";
        shrinkRadio.parentElement.style.cursor = "";
      }
      if (growRadio) {
        growRadio.disabled = false;
        growRadio.parentElement.style.opacity = "1";
        growRadio.parentElement.style.cursor = "";
      }
      if (stretchRadio) {
        stretchRadio.disabled = false;
        stretchRadio.parentElement.style.opacity = "1";
        stretchRadio.parentElement.style.cursor = "";
      }
      if (customRadio) {
        customRadio.disabled = false;
        customRadio.parentElement.style.opacity = "1";
        customRadio.parentElement.style.cursor = "";
      }
    }
  }

  // Function to update scaling mode and zoom control visibility
  function updateScalingModeAndZoomVisibility() {
    const customRadio = document.getElementById("scalingModeCustom");
    const blockSizeSliderDiv = document.getElementById("blockSizeSlider")
      ? document.getElementById("blockSizeSlider").parentElement
      : null;
    const zoomSliderDiv = document.getElementById("zoomSlider")
      ? document.getElementById("zoomSlider").parentElement
      : null;

    if (customRadio && customRadio.checked && window.uploadedImage) {
      // Custom mode: show zoom control
      if (zoomControl) utils.removeHiddenClass(zoomControl, "inline-flex");

      // Show/hide block size or zoom based on pixel perfect checkbox
      if (pixelPerfectCheckbox && pixelPerfectCheckbox.checked) {
        // Pixel perfect mode: show block size, hide zoom
        if (zoomSliderDiv) utils.addHiddenClass(zoomSliderDiv);
        if (blockSizeSliderDiv)
          utils.removeHiddenClass(blockSizeSliderDiv, "flex");
      } else {
        // Normal mode: show zoom, hide block size
        if (zoomSliderDiv) utils.removeHiddenClass(zoomSliderDiv, "flex");
        if (blockSizeSliderDiv) utils.addHiddenClass(blockSizeSliderDiv);
      }
    } else {
      // Non-custom mode: hide zoom control
      if (zoomControl) utils.addHiddenClass(zoomControl);
    }
  }

  // Function to update zoom control visibility
  function updateZoomControlVisibility() {
    if (!window.uploadedImage) {
      utils.addHiddenClass(zoomControl);
      return;
    }
    updateScalingModeAndZoomVisibility();
  }

  // Add zoom and offset slider listeners
  utils.addSliderListener(zoomSlider, zoomValue, (val) =>
    parseFloat(val).toFixed(2),
  );
  utils.addSliderListener(offsetXSlider, offsetXValue, (val) =>
    parseFloat(val).toFixed(2),
  );
  utils.addSliderListener(offsetYSlider, offsetYValue, (val) =>
    parseFloat(val).toFixed(2),
  );

  // On page load, ensure radio buttons and zoom control are shown/hidden correctly
  updateScalingModeRadioButtons();
  updateScalingModeAndZoomVisibility();

  // Ensure result and debug sections are hidden on page load
  utils.addHiddenClass(resultSection);
  utils.addHiddenClass(debugSection);
})();
