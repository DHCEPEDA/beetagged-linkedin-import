/**
 * Color utility functions for tag and UI components
 */

/**
 * Determines if a color is light or dark to ensure text displayed on it remains readable.
 * @param {string} color - The hex color code (e.g., '#3867d6')
 * @returns {boolean} true if the color is light, false if dark
 */
export const isLightColor = (color) => {
  // Default to treating as dark if color format is invalid
  if (!color || typeof color !== 'string') {
    return false;
  }
  
  // Convert hex to RGB
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    // Handle both 3-digit and 6-digit hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      // Invalid hex, default to dark
      return false;
    }
  } else {
    // For named colors or other formats, default to dark text
    return false;
  }
  
  // Calculate perceived brightness using the YIQ formula
  // This gives more weight to colors the human eye is more sensitive to
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // YIQ threshold: >= 128 is light, < 128 is dark
  return yiq >= 128;
};

/**
 * Converts a hex color to RGB values
 * @param {string} hex - The hex color code (e.g., '#3867d6' or '3867d6')
 * @returns {Object|null} Object with r, g, b values or null if invalid
 */
export const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') {
    return null;
  }
  
  // Remove the # if it exists
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Handle both 3-digit and 6-digit hex
  let r, g, b;
  
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    return null;
  }
  
  return { r, g, b };
};

/**
 * Converts RGB values to a hex color string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string (e.g., '#3867d6')
 */
export const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Lightens a color by a specified percentage
 * @param {string} color - The hex color code (e.g., '#3867d6')
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened color hex string
 */
export const lightenColor = (color, percent = 20) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const { r, g, b } = rgb;
  const amount = Math.floor(255 * (percent / 100));
  
  const newR = Math.min(r + amount, 255);
  const newG = Math.min(g + amount, 255);
  const newB = Math.min(b + amount, 255);
  
  return rgbToHex(newR, newG, newB);
};

/**
 * Darkens a color by a specified percentage
 * @param {string} color - The hex color code (e.g., '#3867d6')
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened color hex string
 */
export const darkenColor = (color, percent = 20) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const { r, g, b } = rgb;
  const amount = Math.floor(255 * (percent / 100));
  
  const newR = Math.max(r - amount, 0);
  const newG = Math.max(g - amount, 0);
  const newB = Math.max(b - amount, 0);
  
  return rgbToHex(newR, newG, newB);
};

/**
 * Generates a random color
 * @returns {string} Random hex color string
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};