/**
 * Color utility functions for tag and UI components
 * Based on the iOS UIColor+Bee implementation
 */

// Standard bee colors from UIColor+Bee
export const GOLD_BEE_COLOR = '#FD9E31'; // the darker yellow of the bee icon
export const YELLOW_BEE_COLOR = '#FFEC16'; // the lighter color of the bee icon
export const CLOUDS_COLOR = '#ECF0F1'; // a light gray color

/**
 * Determines if a color is light or dark to ensure text displayed on it remains readable.
 * @param {string} color - The hex color code (e.g., '#3867d6')
 * @returns {boolean} true if the color is light, false if dark
 */
export const isLightColor = (color) => {
  const rgb = hexToRgb(color);
  if (!rgb) return true;
  
  // Calculate perceived brightness using the formula:
  // (0.299*R + 0.587*G + 0.114*B)
  const brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  return brightness > 0.65; // Threshold can be adjusted as needed
};

/**
 * Converts a hex color to RGB values
 * @param {string} hex - The hex color code (e.g., '#3867d6' or '3867d6')
 * @returns {Object|null} Object with r, g, b values or null if invalid
 */
export const hexToRgb = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Check if it's a 3-digit hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Check if it's a valid hex
  if (hex.length !== 6) {
    return null;
  }
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
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
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
  
  const factor = percent / 100;
  const r = rgb.r + (255 - rgb.r) * factor;
  const g = rgb.g + (255 - rgb.g) * factor;
  const b = rgb.b + (255 - rgb.b) * factor;
  
  return rgbToHex(r, g, b);
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
  
  const factor = percent / 100;
  const r = rgb.r * (1 - factor);
  const g = rgb.g * (1 - factor);
  const b = rgb.b * (1 - factor);
  
  return rgbToHex(r, g, b);
};

/**
 * Generates a random color
 * @returns {string} Random hex color string
 */
export const getRandomColor = () => {
  // Bee-like colors from UIColor+Bee implementation
  const beeColors = [
    '#FD9E31', // goldBeeColor - the darker yellow of the bee icon
    '#FFEC16', // yellowBeeColor - the lighter color of the bee icon
    '#ECF0F1', // cloudsColor - a light gray color
    // Additional complementary colors
    '#FFC107', // Amber
    '#FFB300', // Amber darken-1
    '#FF9800', // Orange
    '#FB8C00', // Orange darken-1
    '#FF5722', // Deep Orange
    '#FFA000', // Amber darken-2
    '#F57C00', // Orange darken-2
    '#3F51B5', // Indigo (for contrast)
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#8BC34A', // Light Green
  ];
  
  return beeColors[Math.floor(Math.random() * beeColors.length)];
};