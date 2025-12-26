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

// Ensure yt-dlp is available
const YT_DLP_PATH = '/tmp/yt-dlp';

async function ensureYtDlp() {
  try {
    await fs.access(YT_DLP_PATH);
    return YT_DLP_PATH;
  } catch {
    // Fallback to system yt-dlp
    try {
      await execAsync('which yt-dlp');
      return 'yt-dlp';
    } catch {
      throw new Error('yt-dlp not found. Contact @Aotpy for support.');
    }
  }
}

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  res.setHeader('X-Warning', DEVELOPER_INFO.warning);
  res.setHeader('X-Service', 'Instagram Downloader by Paras Chourasiya (@Aotpy)');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use GET with URL parameter.',
      developer: DEVELOPER_INFO.author,
      contact: DEVELOPER_INFO.telegram,
      example: 'GET /api/download?url=https://www.instagram.com/p/CxamplePost'
    });
  }

  const { url, type = 'auto', quality = 'best' } = req.query;

  // Show welcome if no URL
  if (!url) {
    return res.status(200).json({
      service: "Instagram Media Downloader API",
      developer: DEVELOPER_INFO.author,
      telegram: DEVELOPER_INFO.telegram,
      contact: "For support: Telegram @Aotpy",
      description: "Download Instagram posts, reels, and stories",
      endpoints: {
        health: "GET /api/health",
        download: "GET /api/download?url=URL",
        example: "GET /api/download?url=https://www.instagram.com/p/CxamplePost"
      },
      parameters: {
        url: "Instagram URL (required)",
        type: "post|reel|story|all (default: auto)",
        quality: "best|worst (default: best)"
      },
      warning: DEVELOPER_INFO.warning
    });
  }

  try {
    // Validate URL
    if (!url.includes('instagram.com')) {
      return res.status(400).json({ 
        error: 'Invalid Instagram URL',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        example: 'https://www.instagram.com/p/CxamplePost',
        suggestion: 'Make sure the URL starts with https://www.instagram.com/'
      });
    }

    // Ensure yt-dlp is available
    const ytDlpPath = await ensureYtDlp();
    console.log(`🔧 Using yt-dlp at: ${ytDlpPath}`);
    console.log(`📥 Processing: ${url}`);
    
    // Create temp directory
    const tempDir = `/tmp/insta_${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    // Build command
    let command = `${ytDlpPath} --no-warnings --no-check-certificate `;
    command += `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" `;
    
    // Quality settings
    if (quality === 'worst') {
      command += `-f "worst[height<=480]" `;
    } else {
      command += `-f "best[height<=720]/best" `;
    }
    
    // Output template
    command += `-o "${tempDir}/%(title).80s.%(ext)s" `;
    
    // Type-specific options
    if (type === 'all') {
      command += '--yes-playlist ';
    }
    
    command += `"${url}"`;

    console.log(`🚀 Executing: ${command.substring(0, 100)}...`);
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 25000,
      maxBuffer: 1024 * 1024 * 2
    });

    // Find downloaded files
    const files = await fs.readdir(tempDir);
    const mediaFiles = files.filter(f => 
      ['.mp4', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.webp']
        .includes(path.extname(f).toLowerCase())
    );

    if (mediaFiles.length === 0) {
      return res.status(404).json({ 
        error: 'No media found',
        possible_reasons: [
          'Private account/content',
          'Invalid URL',
          'Instagram API changes',
          'Rate limiting'
        ],
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        suggestion: 'Contact @Aotpy on Telegram for support'
      });
    }

    // Get media info
    const mediaInfo = [];
    
    for (const file of mediaFiles) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      const ext = path.extname(file).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.mkv'].includes(ext);
      
      mediaInfo.push({
        filename: file,
        size: formatBytes(stats.size),
        type: isVideo ? 'video' : 'image',
        format: ext.replace('.', ''),
        download_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/serve?file=${encodeURIComponent(file)}&temp=${path.basename(tempDir)}`,
        expires: '5 minutes'
      });
    }

    // Clean up old temp directories after 5 minutes
    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up: ${tempDir}`);
      } catch (e) {
        console.error('Cleanup error:', e.message);
      }
    }, 5 * 60 * 1000);

    return res.status(200).json({
      success: true,
      service: "Instagram Downloader API",
      developer: "Paras Chourasiya",
      contact: "Telegram: @Aotpy",
      warning: "For personal use only. Contact @Aotpy for issues.",
      request: {
        url: url,
        type: type,
        quality: quality
      },
      result: {
        count: mediaInfo.length,
        files: mediaInfo
      },
      instructions: "Use download_url to get the file. Links expire in 5 minutes.",
      support: "Problems? Contact @Aotpy on Telegram"
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    let userMessage = 'Download failed';
    if (error.message.includes('timeout')) userMessage = 'Request timeout (25s limit)';
    if (error.message.includes('not found')) userMessage = 'Content not found';
    
    return res.status(500).json({
      error: userMessage,
      developer: "Paras Chourasiya",
      contact: "Telegram: @Aotpy",
      details: error.message.substring(0, 100),
      support: "Please contact @Aotpy on Telegram with this error",
      tips: [
        'Try a different Instagram URL',
        'Check if content is public',
        'Wait a few minutes and try again'
      ]
    });
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
