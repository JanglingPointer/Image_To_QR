/**
 * Color conversion utilities: HSL, HSB, hex, RGB, luminance.
 */

/**
 * Clamps a number to [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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
 * Converts sRGB to linear RGB component.
 * @param {number} c - sRGB component (0-1)
 * @returns {number} linear RGB component (0-1)
 */
function srgbToLinear(c) {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts linear RGB to sRGB component.
 * @param {number} c - linear RGB component
 * @returns {number} sRGB component (0-1)
 */
function linearToSrgb(c) {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Converts RGB values to OKLCH.
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Object} Object with l, c, h (l/c: 0-100, h: 0-360)
 */
function rgbToOklch(r, g, b) {
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);

  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const oklabL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const oklabA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const oklabB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(oklabA * oklabA + oklabB * oklabB);
  let h = Math.atan2(oklabB, oklabA) * (180 / Math.PI);
  if (h < 0) h += 360;

  return {
    l: oklabL * 100,
    c: c * 100,
    h,
  };
}

/**
 * Converts OKLCH values to RGB.
 * @param {number} lVal - Lightness (0-100)
 * @param {number} cVal - Chroma (0-100)
 * @param {number} hVal - Hue (0-360)
 * @returns {Object} Object with r, g, b values (0-255)
 */
function oklchToRgb(lVal, cVal, hVal) {
  const l = clamp(lVal, 0, 100) / 100;
  const requestedC = Math.max(0, cVal) / 100;
  const hRad = (hVal * Math.PI) / 180;

  const toLinearRgb = (c) => {
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;

    const lCube = l_ * l_ * l_;
    const mCube = m_ * m_ * m_;
    const sCube = s_ * s_ * s_;

    return {
      r:
        4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
      g:
        -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
      b:
        -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
    };
  };

  const inSrgbGamut = (linear) =>
    linear.r >= 0 &&
    linear.r <= 1 &&
    linear.g >= 0 &&
    linear.g <= 1 &&
    linear.b >= 0 &&
    linear.b <= 1;

  // Keep target lightness/hue and reduce chroma until the color is reachable in sRGB.
  let usableC = requestedC;
  if (!inSrgbGamut(toLinearRgb(usableC))) {
    let low = 0;
    let high = usableC;
    for (let i = 0; i < 18; i++) {
      const mid = (low + high) / 2;
      if (inSrgbGamut(toLinearRgb(mid))) {
        low = mid;
      } else {
        high = mid;
      }
    }
    usableC = low;
  }

  const linear = toLinearRgb(usableC);

  return {
    r: Math.round(clamp(linearToSrgb(linear.r), 0, 1) * 255),
    g: Math.round(clamp(linearToSrgb(linear.g), 0, 1) * 255),
    b: Math.round(clamp(linearToSrgb(linear.b), 0, 1) * 255),
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
