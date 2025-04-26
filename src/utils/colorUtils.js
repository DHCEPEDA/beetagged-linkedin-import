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