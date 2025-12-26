const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🔧 Setting up yt-dlp for Instagram Downloader API...');
console.log('👨‍💻 Developer: Paras Chourasiya (Telegram: @Aotpy)');

async function setupYtDlp() {
  try {
    // Create tmp directory if it doesn't exist
    await fs.ensureDir('/tmp');
    
    // Check if yt-dlp already exists
    try {
      const { stdout } = await execAsync('which yt-dlp');
      console.log('✅ yt-dlp found at:', stdout.trim());
      return;
    } catch (error) {
      console.log('📥 yt-dlp not found, downloading...');
    }

    // Download yt-dlp binary
    console.log('⬇️  Downloading yt-dlp...');
    await execAsync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp');
    
    // Make it executable
    await execAsync('chmod a+rx /tmp/yt-dlp');
    
    // Verify installation
    const { stdout: version } = await execAsync('/tmp/yt-dlp --version');
    console.log(`✅ yt-dlp installed successfully! Version: ${version.trim()}`);
    console.log('💡 Developer: Paras Chourasiya | Contact: @Aotpy on Telegram');
    
  } catch (error) {
    console.error('❌ Failed to setup yt-dlp:', error.message);
    console.error('📞 Contact @Aotpy on Telegram for support');
    process.exit(1);
  }
}

setupYtDlp();
