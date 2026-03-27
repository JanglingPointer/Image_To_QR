(function () {
  "use strict";

  const imageInput = document.getElementById("imageInput");
  const textInput = document.getElementById("textInput");
  const previewImage = document.getElementById("previewImage");
  const resultSection = document.getElementById("resultSection");
  const testImageBtn = document.getElementById("testImageBtn");
  const debugCheckbox = document.getElementById("debugCheckbox");
  const debugSection = document.getElementById("debugSection");
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
  const clarityValue = document.getElementById("clarityValue");
  const clarityWarning = document.getElementById("clarityWarning");
  const add4thSquareCheckbox = document.getElementById("add4thSquareCheckbox");
  const add4thSquareControl = document.querySelector(".add-4th-square-control");
  const scaleSlider = document.getElementById("scaleSlider");
  const scaleValue = document.getElementById("scaleValue");
  const scaleControl = document.querySelector(".scale-control");
  const noiseSlider = document.getElementById("noiseSlider");
  const noiseValue = document.getElementById("noiseValue");
  const noiseControl = document.querySelector(".noise-control");
  const robustnessResetBtn = document.getElementById("robustnessResetBtn");
  const robustnessControl = document.querySelector(".robustness-control");
  const colorDark = document.getElementById("colorDark");
  const colorBright = document.getElementById("colorBright");
  const colorControl = document.querySelector(".color-control");
  const colorAppearanceDuoTone = document.getElementById(
    "colorAppearanceDuoTone",
  );
  const colorAppearanceColorful = document.getElementById(
    "colorAppearanceColorful",
  );
  const customColorsSection = document.getElementById("customColorsSection");
  const scalingModeGroup = document.querySelector(".scaling-mode-group");
  const bwModeGroup = document.querySelector(".bw-mode-group");
  const mainImageControls = document.querySelector(".main-image-controls");
  const downloadBtn = document.getElementById("downloadBtn");
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

  /** True after the user clicks Dither / Threshold / Original (trusted pointer/keyboard). */
  let userManuallySelectedBwMode = false;

  // Global variable to store the uploaded image
  window.uploadedImage = null;

  // Global variable for noise seed
  window.noiseSeed = 12345;

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
    bwMode: "original_colors", // 'threshold' | 'dither' | 'original_colors'
    blockSize: 1, // 1-8 for pixel art mode
    threshold: 128,
    ditherBrightness: 0, // -1..1
    clarity: 90, // 0..100
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
    if (colorAppearanceDuoTone)
      colorAppearanceDuoTone.checked = !useOriginalColors;
    if (colorAppearanceColorful)
      colorAppearanceColorful.checked = useOriginalColors;
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

  /** Duo Tone is incompatible with BW "Original"; gray out and disable that option. */
  function syncBwModeOriginalAvailability() {
    const bwDither = document.getElementById("bwModeDither");
    const bwPixelArt = document.getElementById("bwModePixelArt");
    if (!bwPixelArt) return;

    const duoSelected = colorAppearanceDuoTone && colorAppearanceDuoTone.checked;

    if (duoSelected) {
      bwPixelArt.disabled = true;
      const label = bwPixelArt.closest("label");
      if (label) label.classList.add("bw-mode-option-disabled");
      if (bwPixelArt.checked && bwDither) {
        bwDither.checked = true;
      }
    } else {
      bwPixelArt.disabled = false;
      const label = bwPixelArt.closest("label");
      if (label) label.classList.remove("bw-mode-option-disabled");
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
      bwPixelArt.checked = settings.bwMode === "original_colors";
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
        settings.bwMode === "original_colors" ? "0" : String(settings.saturationBoost);
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
    updateRobustnessWarning();
    syncBwModeOriginalAvailability();
    // Initially hide main image controls until image is uploaded
    utils.addHiddenClass(mainImageControls);
    // Ensure slider value labels reflect current values
    utils.updateSliderValue(thresholdSlider, thresholdValue);
    utils.updateSliderValue(scaleSlider, scaleValue);
    utils.updateSliderValue(noiseSlider, noiseValue);
    utils.updateSliderValue(claritySlider, clarityValue);
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

  function updateRobustnessWarning() {
    if (!claritySlider || !clarityWarning) return;
    const robustness = parseFloat(claritySlider.value);
    if (robustness < 80) {
      utils.removeHiddenClass(clarityWarning, "inline");
    } else {
      utils.addHiddenClass(clarityWarning);
    }
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
    const averagePixelValue = window.calculateAveragePixelValue(image);
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
            utils.removeHiddenClass(robustnessControl);
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

  // Generate test image (uses image-manipulation for generation, handles UI)
  function generateTestImage() {
    const dataUrl = window.generateRandomTestImageDataUrl();
    const testImage = new Image();
    testImage.onload = function () {
      window.uploadedImage = testImage;
      previewImage.src = dataUrl;
      utils.removeHiddenClass(previewImage);
      document.querySelector(".file-input-text").style.display = "none";
      utils.removeHiddenClass(mainImageControls);
      utils.removeHiddenClass(scaleControl);
      utils.removeHiddenClass(noiseControl);
      utils.removeHiddenClass(robustnessControl);
      utils.removeHiddenClass(colorControl);
      utils.removeHiddenClass(scalingModeGroup, "flex");
      utils.removeHiddenClass(bwModeGroup);
      autoAdjustThreshold(window.uploadedImage);
      autoComputeBlockSize();
      updateDitherBrightnessVisibility();
      updateZoomControlVisibility();
      updateResult();
    };
    testImage.src = dataUrl;
  }

  // Handle test image button
  testImageBtn.addEventListener("click", generateTestImage);

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
  });

  // Add slider listeners using utility function
  utils.addSliderListener(thresholdSlider, thresholdValue);
  utils.addSliderListener(scaleSlider, scaleValue);
  utils.addSliderListener(noiseSlider, noiseValue);
  utils.addSliderListener(claritySlider, clarityValue);
  updateRobustnessWarning();

  // Add event listener for noise seed button
  const noiseSeedBtn = document.getElementById("noiseSeedBtn");
  noiseSeedBtn.addEventListener("click", function () {
    // Change the global noise seed to a new random value
    window.noiseSeed = Math.floor(Math.random() * 1000000000);
    if (window.uploadedImage) {
      updateResult();
    }
  });

  // Function to validate color and apply red border if out of range
  function validateColorRange(colorInput, isDark) {
    const luminance = window.calculateLuminance(colorInput.value);
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

  function onColorAppearanceChange() {
    syncBwModeOriginalAvailability();
    if (!userManuallySelectedBwMode) {
      const bwDither = document.getElementById("bwModeDither");
      const bwPixelArt = document.getElementById("bwModePixelArt");
      if (colorAppearanceDuoTone && colorAppearanceDuoTone.checked && bwDither) {
        bwDither.checked = true;
      } else if (
        colorAppearanceColorful &&
        colorAppearanceColorful.checked &&
        bwPixelArt
      ) {
        bwPixelArt.checked = true;
      }
    }
    const saturationBoostGroup = document.querySelector(
      ".saturation-boost-group",
    );
    if (colorAppearanceDuoTone && colorAppearanceDuoTone.checked) {
      utils.removeHiddenClass(customColorsSection, "flex");
      utils.addHiddenClass(saturationBoostGroup);
    } else {
      utils.addHiddenClass(customColorsSection);
      utils.removeHiddenClass(saturationBoostGroup, "flex");
    }
    if (window.uploadedImage) {
      updateResult();
    }
  }
  if (colorAppearanceDuoTone)
    colorAppearanceDuoTone.addEventListener("change", onColorAppearanceChange);
  if (colorAppearanceColorful)
    colorAppearanceColorful.addEventListener(
      "change",
      onColorAppearanceChange,
    );

  ["bwModeThreshold", "bwModeDither", "bwModePixelArt"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", function (e) {
        if (e.isTrusted) {
          userManuallySelectedBwMode = true;
        }
      });
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

  // Initialize Original mode visibility
  updateOriginalModeVisibility();

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
    if (window.debugModule) window.debugModule.clear();

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
      const useOriginalColors =
        colorAppearanceColorful && colorAppearanceColorful.checked;
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
      let blockSize = 0; // Default to 0 for regular scaling mode
      if (customRadio && customRadio.checked) {
        if (pixelPerfectCheckbox && pixelPerfectCheckbox.checked) {
          // Pixel perfect mode: use blockSize (including blockSize = 1)
          zoomValue = 0;
          blockSize = parseInt(blockSizeSlider.value, 10);
        } else {
          // Normal mode: use zoom
          zoomValue = parseFloat(zoomSlider.value);
          blockSize = 0; // Use 0 to indicate regular scaling mode
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
        ? "original_colors"
        : document.getElementById("bwModeDither").checked
          ? "dither"
          : "threshold";
      let ditherGamma = 1.0;
      if (bwMode === "dither" && ditherBrightnessSlider) {
        ditherGamma = parseFloat(ditherBrightnessSlider.value);
      }
      const clarity = claritySlider ? parseFloat(claritySlider.value) : 90;
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
      // Debug logging: list all user-selected modes and values (compact)
      if (window.debugModule && window.debugModule.isEnabled()) {
        const log = window.debugModule.log;
        log("=== SETTINGS ===");
        log(
          `BW: ${bwMode} | Thresh: ${threshold} | Dither: ${ditherGamma}`,
        );
        log(
          `Scale: ${scaleFactor}x | Noise: ${noiseProbability}% | Seed: ${noiseSeed}`,
        );
        log(
          `Colors: ${darkColor} / ${brightColor} | Orig: ${useOriginalColors} | Sat: ${saturationBoost} | Shine: ${shine}`,
        );
        log(
          `ScaleMode: ${scalingMode} | PP: ${pixelPerfectCheckbox ? pixelPerfectCheckbox.checked : false} | Zoom: ${zoomValue} | Offset: (${offsetXValue}, ${offsetYValue})`,
        );
        log(
          `Clarity: ${clarity} | 4thSqr: ${add4thSquare} | BlockSz: ${blockSize} | OutPx: ${outsidePixels}${outsidePixels === "color" ? ":" + outsidePixelsColor : ""}`,
        );
        log("=================");
      }

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
      );
      utils.removeHiddenClass(resultSection, "flex");

      // Handle debug output
      if (debugCheckbox.checked && debugData && window.debugModule) {
        utils.removeHiddenClass(debugSection, "flex");
        window.debugModule.renderAllDebugImages(debugData);
      } else {
        utils.addHiddenClass(debugSection);
      }

      // Log input and output dimensions at the end of successful update
      if (
        window.uploadedImage &&
        debugData &&
        debugData.result_colored_xN &&
        window.debugModule
      ) {
        const inputWidth = window.uploadedImage.width;
        const inputHeight = window.uploadedImage.height;
        const outputWidth = debugData.result_colored_xN.width;
        const outputHeight = debugData.result_colored_xN.height;
        window.debugModule.log(
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
        updateOriginalModeVisibility();
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

  if (claritySlider) {
    claritySlider.addEventListener("input", updateRobustnessWarning);
  }

  if (robustnessResetBtn && claritySlider) {
    robustnessResetBtn.addEventListener("click", function () {
      claritySlider.value = "90";
      utils.updateSliderValue(claritySlider, clarityValue);
      updateRobustnessWarning();
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

  // Function to update visibility of sliders when Original mode is selected
  function updateOriginalModeVisibility() {
    const originalRadio = document.getElementById("bwModePixelArt");
    const thresholdSliderDiv = thresholdSlider
      ? thresholdSlider.parentElement.parentElement
      : null;
    const ditherSliderDiv = ditherBrightnessSlider
      ? ditherBrightnessSlider.parentElement.parentElement
      : null;

    if (originalRadio && originalRadio.checked) {
      // Hide both sliders when Original mode is selected
      if (thresholdSliderDiv) utils.addHiddenClass(thresholdSliderDiv);
      if (ditherSliderDiv) utils.addHiddenClass(ditherSliderDiv);
    } else {
      // Show sliders based on the current mode (dither or threshold)
      updateDitherBrightnessVisibility();
    }
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
