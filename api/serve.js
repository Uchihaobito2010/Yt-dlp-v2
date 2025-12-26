const fs = require('fs').promises;
const path = require('path');

// Developer information
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy"
};

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  
  const { path: filePath, name } = req.query;
  
  if (!filePath || !name) {
    return res.status(400).json({
      error: 'File path and name are required',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      usage: '/api/serve?path=FILE_PATH&name=FILENAME'
    });
  }
  
  try {
    // Security check - ensure path is within /tmp
    const decodedPath = decodeURIComponent(filePath);
    const decodedName = decodeURIComponent(name);
    
    if (!decodedPath.startsWith('/tmp/') || !decodedPath.includes('insta_')) {
      return res.status(403).json({
        error: 'Access denied',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram
      });
    }
    
    // Check if file exists
    try {
      await fs.access(decodedPath);
    } catch {
      return res.status(404).json({
        error: 'File not found or expired',
        note: 'Download links expire after 5 minutes',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram
      });
    }
    
    const stats = await fs.stat(decodedPath);
    
    // Check file size (Vercel limit: 50MB)
    if (stats.size > 50 * 1024 * 1024) {
      return res.status(413).json({
        error: 'File too large (max 50MB)',
        size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        suggestion: 'Try downloading lower quality version'
      });
    }
    
    // Set appropriate headers
    const ext = path.extname(decodedName).toLowerCase();
    const contentType = getContentType(ext);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${decodedName}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('X-File-Name', decodedName);
    res.setHeader('X-File-Size', stats.size);
    res.setHeader('X-Developer', DEVELOPER_INFO.author);
    res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
    
    // Stream the file
    const fileStream = await fs.readFile(decodedPath);
    res.send(fileStream);
    
    // Clean up file after sending (optional)
    setTimeout(async () => {
      try {
        await fs.unlink(decodedPath);
        console.log(`Cleaned up: ${decodedPath}`);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Serve error:', error);
    
    return res.status(500).json({
      error: 'Failed to serve file',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      details: error.message
    });
  }
};

function getContentType(ext) {
  const contentTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
                                  }
