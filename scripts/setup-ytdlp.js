const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const https = require('https');
const { createWriteStream } = require('fs');

console.log('🚀 Setting up Instagram Downloader API...');
console.log('👨‍💻 Developer: Paras Chourasiya (Telegram: @Aotpy)');
console.log('📞 Support: Contact @Aotpy on Telegram for issues');

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destination);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete file on error
      reject(err);
    });
  });
}

async function setupYtDlp() {
  try {
    console.log('📁 Creating necessary directories...');
    await fs.ensureDir('/tmp');
    
    const ytDlpPath = '/tmp/yt-dlp';
    const ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    console.log('⬇️  Downloading yt-dlp from GitHub...');
    
    try {
      // Download yt-dlp
      await downloadFile(ytDlpUrl, ytDlpPath);
      
      // Make executable
      await execAsync(`chmod +x ${ytDlpPath}`);
      
      // Test yt-dlp
      const { stdout } = await execAsync(`${ytDlpPath} --version`);
      console.log(`✅ yt-dlp installed successfully! Version: ${stdout.trim()}`);
      
      // Also install ffmpeg for better compatibility
      console.log('📦 Installing ffmpeg...');
      try {
        await execAsync('apt-get update && apt-get install -y ffmpeg');
        console.log('✅ ffmpeg installed');
      } catch (ffmpegError) {
        console.log('⚠️  Could not install ffmpeg, continuing without it');
      }
      
    } catch (downloadError) {
      console.log('⚠️  Direct download failed, trying alternative method...');
      
      // Alternative: Use curl
      try {
        await execAsync(`curl -L ${ytDlpUrl} -o ${ytDlpPath}`);
        await execAsync(`chmod +x ${ytDlpPath}`);
        console.log('✅ yt-dlp downloaded via curl');
      } catch (curlError) {
        console.log('⚠️  Curl download failed, trying wget...');
        
        // Another alternative: Use wget
        try {
          await execAsync(`wget ${ytDlpUrl} -O ${ytDlpPath}`);
          await execAsync(`chmod +x ${ytDlpPath}`);
          console.log('✅ yt-dlp downloaded via wget');
        } catch (wgetError) {
          console.error('❌ All download methods failed');
          throw new Error('Could not download yt-dlp');
        }
      }
    }

    // Create a simple test script
    const testScript = `
#!/bin/bash
echo "Instagram Downloader API Setup Complete"
echo "Developer: Paras Chourasiya"
echo "Telegram: @Aotpy"
echo "Support: Contact @Aotpy for issues"
${ytDlpPath} --version
`;
    
    await fs.writeFile('/tmp/setup-complete.sh', testScript);
    await execAsync('chmod +x /tmp/setup-complete.sh');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('📞 Remember: For any issues, contact @Aotpy on Telegram');
    console.log('🔧 yt-dlp path:', ytDlpPath);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('📞 Contact @Aotpy on Telegram immediately');
    console.error('💡 Please share this error message with @Aotpy');
    
    // Create error file for debugging
    await fs.writeFile('/tmp/setup-error.log', error.stack);
    
    // Don't exit with error, just warn
    console.log('⚠️  Continuing build with limited functionality...');
  }
}

setupYtDlp();
