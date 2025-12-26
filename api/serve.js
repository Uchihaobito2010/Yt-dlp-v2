const fs = require('fs').promises;
const path = require('path');

const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy"
};

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  res.setHeader('X-Service', 'Instagram Downloader by Paras Chourasiya (@Aotpy)');
  
  const { file, temp } = req.query;
  
  if (!file || !temp) {
    return res.status(400).json({
      error: 'Missing parameters',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      usage: '/api/serve?file=FILENAME&temp=TEMP_DIR_ID',
      example: '/api/serve?file=video.mp4&temp=insta_123456789'
    });
  }
  
  try {
    const fileName = decodeURIComponent(file);
    const tempDir = `/tmp/${decodeURIComponent(temp)}`;
    const filePath = path.join(tempDir, fileName);
    
    // Security check
    if (!tempDir.startsWith('/tmp/insta_') || !filePath.startsWith(tempDir)) {
      return res.status(403).json({
        error: 'Access denied',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram
      });
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'File expired or not found',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        note: 'Download links expire after 5 minutes',
        support: 'Contact @Aotpy on Telegram if issue persists'
      });
    }
    
    const stats = await fs.stat(filePath);
    
    // Check file size (Vercel limit)
    if (stats.size > 45 * 1024 * 1024) { // 45MB for safety
      return res.status(413).json({
        error: 'File too large',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        max_size: '45MB',
        file_size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
        suggestion: 'Try lower quality or contact @Aotpy'
      });
    }
    
    // Set content type
    const ext = path.extname(fileName).toLowerCase();
    const contentType = getContentType(ext);
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('X-File-Name', fileName);
    res.setHeader('X-File-Size', stats.size);
    res.setHeader('X-Developer', DEVELOPER_INFO.author);
    res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
    res.setHeader('X-Expires', '5 minutes from download');
    
    // Send file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
    console.log(`📤 Served: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    
  } catch (error) {
    console.error('Serve error:', error.message);
    
    return res.status(500).json({
      error: 'Failed to serve file',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      details: error.message,
      support: 'Contact @Aotpy on Telegram immediately'
    });
  }
};

function getContentType(ext) {
  const types = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
        }
