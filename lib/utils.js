/**
 * Validates Instagram URL
 * @param {string} url - Instagram URL
 * @returns {boolean}
 */
function isValidInstagramUrl(url) {
  const instagramPatterns = [
    /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories?)\/[\w\-\.]+/i,
    /https?:\/\/(www\.)?instagram\.com\/[\w\.]+\/?$/i
  ];
  
  return instagramPatterns.some(pattern => pattern.test(url));
}

/**
 * Extracts media type from URL
 * @param {string} url - Instagram URL
 * @returns {string}
 */
function getMediaTypeFromUrl(url) {
  if (url.includes('/reel/') || url.includes('/tv/')) return 'reel';
  if (url.includes('/p/')) return 'post';
  if (url.includes('/stories')) return 'story';
  return 'auto';
}

/**
 * Sanitize filename
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9\-_.]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 200);
}

module.exports = {
  isValidInstagramUrl,
  getMediaTypeFromUrl,
  sanitizeFilename
};
