const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "Telegram: @Aotpy",
  warning: "For personal use only. Contact @Aotpy for issues."
};

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  res.setHeader('X-Warning', DEVELOPER_INFO.warning);
  res.setHeader('X-Service', 'Instagram Downloader API v2.0');
  
  // Try to check yt-dlp
  let ytDlpStatus = 'Checking...';
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Check for yt-dlp
    try {
      await execAsync('which yt-dlp');
      ytDlpStatus = '✅ Available (system)';
    } catch {
      try {
        await execAsync('ls /tmp/yt-dlp');
        ytDlpStatus = '✅ Available (/tmp/yt-dlp)';
      } catch {
        ytDlpStatus = '⚠️ Not found - will download on first use';
      }
    }
  } catch (error) {
    ytDlpStatus = '❌ Error checking';
  }
  
  res.status(200).json({
    service: "Instagram Media Downloader API",
    version: "2.0.0",
    status: "🟢 Operational",
    
    developer: {
      name: DEVELOPER_INFO.author,
      telegram: DEVELOPER_INFO.telegram,
      contact: "Message @Aotpy on Telegram for support",
      response_time: "Usually within 24 hours"
    },
    
    system: {
      node_version: "24.x",
      platform: "Vercel Serverless",
      region: "Global",
      yt_dlp: ytDlpStatus,
      uptime: "99.9%",
      timestamp: new Date().toISOString()
    },
    
    endpoints: {
      home: "GET / (this page)",
      health: "GET /api/health",
      download: "GET /api/download?url=INSTAGRAM_URL"
    },
    
    usage: {
      basic: "/api/download?url=https://www.instagram.com/p/CxamplePost",
      with_type: "/api/download?url=URL&type=reel&quality=best",
      types: "post, reel, story, all, auto",
      quality: "best, worst"
    },
    
    limits: {
      timeout: "25 seconds per request",
      max_file: "45 MB",
      retention: "5 minutes",
      format: "MP4, JPG, PNG, WebP"
    },
    
    legal: {
      warning: DEVELOPER_INFO.warning,
      terms: "You must own or have permission to download content",
      responsibility: "You are responsible for your usage",
      copyright: "Respect all copyright laws"
    },
    
    support: {
      issue: "Having problems?",
      contact: "Telegram: @Aotpy",
      include: "Please include the error message and URL"
    },
    
    examples: [
      "Post: https://www.instagram.com/p/CxamplePost",
      "Reel: https://www.instagram.com/reel/CxampleReel",
      "Story: https://www.instagram.com/stories/username"
    ],
    
    note: "This API is maintained by Paras Chourasiya (@Aotpy). Please use responsibly."
  });
};
