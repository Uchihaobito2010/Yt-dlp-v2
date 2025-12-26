/**
 * Validates Instagram URL
 */
function isValidInstagramUrl(url) {
  const instagramPatterns = [
    /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories?)\/[\w\-\.]+/i,
    /https?:\/\/(www\.)?instagram\.com\/[\w\.]+\/?$/i
  ];
  
  return instagramPatterns.some(pattern => pattern.test(url));
}

/**
 * Developer information for responses
 */
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy",
  warning: "This API is for personal use only. Respect Instagram's Terms of Service."
};

/**
 * Get error response with developer info
 */
function getErrorResponse(message, status = 400) {
  return {
    status: "error",
    message: message,
    developer: DEVELOPER_INFO.author,
    contact: DEVELOPER_INFO.telegram,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get success response with developer info
 */
function getSuccessResponse(data) {
  return {
    status: "success",
    ...data,
    developer: DEVELOPER_INFO.author,
    contact: DEVELOPER_INFO.telegram,
    warning: DEVELOPER_INFO.warning,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  isValidInstagramUrl,
  DEVELOPER_INFO,
  getErrorResponse,
  getSuccessResponse
};
