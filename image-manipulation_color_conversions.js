/**
 * Color conversion utilities: HSL, HSB, hex, RGB, luminance.
 */

/**
 * Converts a hex color string to RGB values
 * @param {string} hexColor - Hex color string (e.g., "#ff0000")
 * @returns {Object} Object with r, g, b values (0-255)
 */
function hexToRgb(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return { r, g, b };
}

/**
 * Parses a hex color string to RGBA array [r, g, b, a].
 * @param {string} hexColor - Hex color (e.g. "#000000")
 * @returns {number[]} [r, g, b, 255]
 */
function hexToRgba(hexColor) {
  const hex = hexColor.replace("#", "");
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
    255,
  ];
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
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
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
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Converts RGB values to HSB (HSV)
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} Object with h, s, b values (h: 0-360, s: 0-100, b: 0-100)
 */
function rgbToHsb(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    b: v * 100,
  };
}

/**
 * Converts HSB (HSV) values to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} bVal - Brightness/Value (0-100)
 * @returns {Object} Object with r, g, b values (0-255)
 */
function hsbToRgb(h, s, bVal) {
  h /= 360;
  s /= 100;
  bVal /= 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = bVal * (1 - s);
  const q = bVal * (1 - f * s);
  const t = bVal * (1 - (1 - f) * s);

  let r, g, b;
  switch (i % 6) {
    case 0:
      r = bVal;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = bVal;
      b = p;
      break;
    case 2:
      r = p;
      g = bVal;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = bVal;
      break;
    case 4:
      r = t;
      g = p;
      b = bVal;
      break;
    case 5:
      r = bVal;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
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
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates relative luminance from a hex color (WCAG formula).
 * @param {string} hexColor - Hex color (e.g. "#000000")
 * @returns {number} Luminance (0-1)
 */
function calculateLuminance(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const toLinear = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}
