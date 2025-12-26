const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

// Developer information
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy",
  warning: "This API is for personal use only. Respect Instagram's Terms of Service.",
  note: "Do not download content you don't own or have permission for."
};

// Download yt-dlp if not available
async function downloadYtDlp() {
  console.log('📥 Downloading yt-dlp on demand...');
  
  const ytDlpPath = '/tmp/yt-dlp-on-demand';
  const ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
  
  try {
    // Try curl first
    await execAsync(`curl -L ${ytDlpUrl} -o ${ytDlpPath} --connect-timeout 10`);
    await execAsync(`chmod +x ${ytDlpPath}`);
    console.log('✅ yt-dlp downloaded successfully');
    return ytDlpPath;
  } catch (error) {
    console.log('⚠️ Curl failed, trying wget...');
    
    try {
      await execAsync(`wget ${ytDlpUrl} -O ${ytDlpPath} --timeout=10`);
      await execAsync(`chmod +x ${ytDlpPath}`);
      console.log('✅ yt-dlp downloaded via wget');
      return ytDlpPath;
    } catch (wgetError) {
      console.error('❌ Could not download yt-dlp');
      return null;
    }
  }
}

async function getYtDlpPath() {
  const possiblePaths = [
    '/tmp/yt-dlp',
    '/tmp/yt-dlp-on-demand',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ];
  
  for (const path of possiblePaths) {
    try {
      await fs.access(path);
      await execAsync(`chmod +x ${path}`); // Ensure executable
      console.log(`✅ Found yt-dlp at: ${path}`);
      return path;
    } catch (error) {
      // Try next path
    }
  }
  
  // Download if not found
  console.log('🔍 yt-dlp not found in standard locations');
  const downloadedPath = await downloadYtDlp();
  if (downloadedPath) {
    return downloadedPath;
  }
  
  throw new Error('yt-dlp not available. The system is still setting up. Please try again in 30 seconds or contact @Aotpy on Telegram.');
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
      status: "🟢 Running",
      note: "yt-dlp is being set up. First request might be slow.",
      endpoints: {
        health: "GET /api/health",
        download: "GET /api/download?url=URL",
        example: "GET /api/download?url=https://www.instagram.com/p/CxamplePost"
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

    // Get yt-dlp path (with auto-download)
    let ytDlpPath;
    try {
      ytDlpPath = await getYtDlpPath();
      console.log(`🔧 Using yt-dlp at: ${ytDlpPath}`);
    } catch (error) {
      return res.status(503).json({
        error: 'Service is setting up',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        message: 'yt-dlp is being downloaded. Please try again in 30 seconds.',
        support: 'If this persists, contact @Aotpy on Telegram',
        status: '🔄 Initializing'
      });
    }
    
    console.log(`📥 Processing: ${url}`);
    
    // Create temp directory
    const tempDir = `/tmp/insta_${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    // Build simple command for testing
    const testCommand = `${ytDlpPath} --version`;
    try {
      await execAsync(testCommand, { timeout: 5000 });
      console.log('✅ yt-dlp is working');
    } catch (testError) {
      console.error('❌ yt-dlp test failed:', testError.message);
      return res.status(500).json({
        error: 'yt-dlp setup failed',
        developer: DEVELOPER_INFO.author,
        contact: DEVELOPER_INFO.telegram,
        message: 'Please contact @Aotpy on Telegram to fix this issue',
        action: 'The developer has been notified'
      });
    }

    // Build download command - SIMPLIFIED FOR TESTING
    let command = `${ytDlpPath} --no-warnings --quiet `;
    command += `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" `;
    command += `-f "best[height<=720]" `;
    command += `-o "${tempDir}/%(title)s.%(ext)s" `;
    command += `--no-check-certificate `;
    command += `"${url}"`;

    console.log(`🚀 Executing command...`);
    
    // Execute with timeout
    let stdout = '', stderr = '';
    try {
      const result = await execAsync(command, { 
        timeout: 20000,
        maxBuffer: 1024 * 1024 * 2
      });
      stdout = result.stdout;
      stderr = result.stderr;
      console.log('✅ Command executed successfully');
    } catch (execError) {
      console.error('Command error:', execError.message);
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';
      
      // Don't fail immediately, check if any files were downloaded
    }

    // Find downloaded files
    let mediaFiles = [];
    try {
      const files = await fs.readdir(tempDir);
      mediaFiles = files.filter(f => 
        ['.mp4', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.webp']
          .includes(path.extname(f).toLowerCase())
      );
    } catch (readError) {
      console.error('Error reading temp dir:', readError.message);
    }

    if (mediaFiles.length === 0) {
      // Try alternative command format
      console.log('⚠️ No files found, trying alternative approach...');
      
      const altCommand = `${ytDlpPath} --get-url --format best "${url}"`;
      try {
        const { stdout: urlStdout } = await execAsync(altCommand, { timeout: 10000 });
        console.log('Direct URL:', urlStdout);
        
        return res.status(200).json({
          service: "Instagram Downloader API",
          developer: DEVELOPER_INFO.author,
          contact: "Telegram: @Aotpy",
          status: "partial_success",
          message: "API is working but content might be restricted",
          direct_url: urlStdout.trim(),
          troubleshooting: [
            "Instagram might be blocking downloads",
            "Try a different public post",
            "Content might be private",
            "Contact @Aotpy for advanced setup"
          ],
          setup: "yt-dlp is installed and working",
          support: "Contact @Aotpy on Telegram for configuration help"
        });
      } catch (altError) {
        console.error('Alternative command failed:', altError.message);
        
        return res.status(404).json({ 
          error: 'Could not download content',
          possible_reasons: [
            'Private account/content',
            'Instagram API changes',
            'Rate limiting',
            'Geographic restrictions'
          ],
          developer: DEVELOPER_INFO.author,
          contact: DEVELOPER_INFO.telegram,
          support: 'Contact @Aotpy on Telegram for help with configuration',
          status: '🟡 Setup incomplete',
          note: 'The API is running but needs configuration for your region'
        });
      }
    }

    // Get media info
    const mediaInfo = [];
    
    for (const file of mediaFiles) {
      const filePath = path.join(tempDir, file);
      try {
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
      } catch (fileError) {
        console.error('Error processing file:', fileError.message);
      }
    }

    // Clean up after 5 minutes
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
      note: "🎉 Success! API is working perfectly!",
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
    console.error('❌ Unexpected error:', error.message);
    
    return res.status(500).json({
      error: 'Internal server error',
      developer: "Paras Chourasiya",
      contact: "Telegram: @Aotpy",
      message: "Please contact @Aotpy immediately with this error",
      error_details: error.message,
      timestamp: new Date().toISOString()
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
