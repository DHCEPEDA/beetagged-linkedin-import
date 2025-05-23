/**
 * Code Generator Utility
 * Generates random access codes for imports and other features
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting similar looking characters like 0, O, 1, I

/**
 * Generate a random access code of specified length
 * @param {number} length - Length of the code to generate
 * @returns {string} - Random access code
 */
function generateRandomCode(length = 6) {
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    code += CHARS[randomIndex];
  }
  
  return code;
}

module.exports = {
  generateRandomCode
};