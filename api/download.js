const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use GET with URL parameter.' 
    });
  }

  const { url, type = 'auto', quality = 'best' } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'Instagram URL is required',
      usage: '/api/download?url=INSTAGRAM_URL&type=post|reel|story|all&quality=best|worst',
      example: '/api/download?url=https://www.instagram.com/p/Cxample&type=reel'
    });
  }

  try {
    // Validate Instagram URL
    if (!url.includes('instagram.com')) {
      return res.status(400).json({ error: 'Invalid Instagram URL' });
    }

    console.log(`Processing: ${url}`);
    
    // Create temp directory
    const tempDir = `/tmp/insta_${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    // Build yt-dlp command
    let command = `yt-dlp --no-warnings --no-check-certificate `;
    
    // Add quality option
    if (quality === 'worst') {
      command += `-f "worst[height<=720]" `;
    } else {
      command += `-f "best[height<=1080]" `;
    }
    
    // Add output template
    command += `-o "${tempDir}/%(title).200s.%(ext)s" `;
    
    // Add additional options based on type
    switch (type) {
      case 'reel':
        command += '--format-sort "res:1080" ';
        break;
      case 'story':
        command += '--download-archive archive.txt ';
        break;
      case 'all':
        command += '--yes-playlist ';
        break;
    }
    
    command += `"${url}"`;

    console.log(`Executing: ${command}`);
    
    // Execute yt-dlp
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });

    console.log('yt-dlp output:', stdout);
    if (stderr) console.error('yt-dlp errors:', stderr);

    // Find downloaded files
    const files = await fs.readdir(tempDir);
    const videoFiles = files.filter(f => 
      ['.mp4', '.webm', '.mkv'].includes(path.extname(f).toLowerCase())
    );
    const imageFiles = files.filter(f => 
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
    );

    if (videoFiles.length === 0 && imageFiles.length === 0) {
      return res.status(404).json({ 
        error: 'No media found',
        stdout: stdout,
        stderr: stderr 
      });
    }

    // Get media info
    const mediaInfo = [];
    
    for (const file of [...videoFiles, ...imageFiles]) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      mediaInfo.push({
        filename: file,
        size: stats.size,
        type: videoFiles.includes(file) ? 'video' : 'image',
        url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/download/file?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(file)}`
      });
    }

    // Return media info (not the actual file in this response)
    return res.status(200).json({
      success: true,
      originalUrl: url,
      type: type,
      quality: quality,
      mediaCount: mediaInfo.length,
      media: mediaInfo,
      note: 'Use the provided URLs to download each media file'
    });

  } catch (error) {
    console.error('Error:', error);
    
    return res.status(500).json({
      error: 'Download failed',
      message: error.message,
      details: error.stderr || error.stdout
    });
  }
};
