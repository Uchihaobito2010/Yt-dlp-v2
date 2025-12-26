const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

// Developer information
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy",
  warning: "This API is for personal use only. Respect Instagram's Terms of Service.",
  note: "Do not download content you don't own or have permission for."
};

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  res.setHeader('X-Warning', DEVELOPER_INFO.warning);
  
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
      error: 'Method not allowed. Use GET with URL parameter.',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      usage: 'GET /api/download?url=INSTAGRAM_URL'
    });
  }

  const { url, type = 'auto', quality = 'best' } = req.query;

  // Show welcome message if no URL
  if (!url) {
    return res.status(400).json({
      service: "Instagram Media Downloader API",
      developer: DEVELOPER_INFO.author,
      telegram: DEVELOPER_INFO.telegram,
      error: 'Instagram URL is required',
      usage: '/api/download?url=INSTAGRAM_URL&type=post|reel|story|all&quality=best|worst',
      example: '/api/download?url=https://www.instagram.com/p/Cxample&type=reel',
      warning: DEVELOPER_INFO.warning,
      contact: DEVELOPER_INFO.contact,
      endpoints: {
        health_check: '/api/health',
        download: '/api/download?url=URL'
      }
    });
  }

  try {
    // Validate Instagram URL
    if (!url.includes('instagram.com')) {
      return res.status(400).json({ 
        error: 'Invalid Instagram URL',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        example: 'https://www.instagram.com/p/CxamplePost'
      });
    }

    console.log(`Processing: ${url}`);
    
    // Create temp directory
    const tempDir = `/tmp/insta_${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    // Build yt-dlp command with better error handling
    let command = `yt-dlp --no-warnings --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" `;
    
    // Add quality option
    if (quality === 'worst') {
      command += `-f "worst[height<=720]" `;
    } else {
      command += `-f "best[height<=1080]/best" `;
    }
    
    // Add output template
    command += `-o "${tempDir}/%(title).100s-%(id)s.%(ext)s" `;
    
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
    
    // Add cookies file if exists (better for private content)
    command += `--cookies-from-browser chrome `;
    
    command += `"${url}"`;

    console.log(`Executing: ${command}`);
    
    // Execute yt-dlp with timeout
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 25000, // 25 seconds timeout
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer
    });

    console.log('yt-dlp output:', stdout);
    if (stderr) console.error('yt-dlp errors:', stderr);

    // Find downloaded files
    const files = await fs.readdir(tempDir);
    const videoFiles = files.filter(f => 
      ['.mp4', '.webm', '.mkv', '.mov'].includes(path.extname(f).toLowerCase())
    );
    const imageFiles = files.filter(f => 
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
    );

    if (videoFiles.length === 0 && imageFiles.length === 0) {
      return res.status(404).json({ 
        error: 'No media found or content might be private',
        suggestion: 'Try using cookies or check if the content is public',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        stdout: stdout.substring(0, 500),
        stderr: stderr?.substring(0, 500) || 'No error output'
      });
    }

    // Get media info
    const mediaInfo = [];
    
    for (const file of [...videoFiles, ...imageFiles]) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      // Check if file is within Vercel limits (50MB)
      if (stats.size > 50 * 1024 * 1024) {
        console.warn(`File ${file} exceeds 50MB limit: ${fileSizeMB}MB`);
      }
      
      mediaInfo.push({
        filename: file,
        size: `${fileSizeMB} MB`,
        bytes: stats.size,
        type: videoFiles.includes(file) ? 'video' : 'image',
        download_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/serve?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(file)}`,
        expires_in: "5 minutes (temporary storage)"
      });
    }

    // Return media info
    return res.status(200).json({
      success: true,
      service: "Instagram Media Downloader API",
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.contact,
      warning: DEVELOPER_INFO.warning,
      original_url: url,
      media_type: type,
      quality: quality,
      media_count: mediaInfo.length,
      media: mediaInfo,
      instructions: "Use the download_url to download each file. Links expire in 5 minutes.",
      note: "For issues or questions, contact on Telegram: @Aotpy"
    });

  } catch (error) {
    console.error('Error:', error);
    
    // Different error messages based on error type
    let errorMessage = 'Download failed';
    let suggestions = [];
    
    if (error.code === 'ETIMEDOUT' || error.killed) {
      errorMessage = 'Download timeout';
      suggestions = [
        'Try again with a smaller video',
        'The Instagram server might be slow',
        'Try different quality setting'
      ];
    } else if (error.message.includes('Command failed')) {
      errorMessage = 'Download command failed';
      suggestions = [
        'Check if the Instagram URL is valid',
        'Content might be private or removed',
        'Try a different Instagram post'
      ];
    }
    
    return res.status(500).json({
      error: errorMessage,
      service: "Instagram Media Downloader API",
      developer: DEVELOPER_INFO.author,
      contact: "For immediate assistance, contact on Telegram: @Aotpy",
      suggestions: suggestions,
      details: error.message.substring(0, 200),
      help: "Check /api/health for API status and usage instructions"
    });
  }
};
