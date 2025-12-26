// Developer information
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  github: "https://github.com/yourusername",
  contact: "Telegram: @Aotpy",
  warning: "For personal use only. Contact @Aotpy for issues."
};

module.exports = async (req, res) => {
  // Add developer headers
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  res.setHeader('X-Warning', DEVELOPER_INFO.warning);
  
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    service: "Instagram Media Downloader API",
    status: "🟢 Operational",
    version: "2.0.0",
    node_version: "24.x",
    
    developer: {
      name: DEVELOPER_INFO.author,
      telegram: DEVELOPER_INFO.telegram,
      contact: DEVELOPER_INFO.contact,
      note: "Contact for issues, questions, or support"
    },
    
    endpoints: {
      home: "GET /",
      health: "GET /api/health",
      download: "GET /api/download?url=INSTAGRAM_URL"
    },
    
    parameters: {
      url: {
        required: true,
        description: "Instagram URL (post, reel, story, etc.)"
      },
      type: {
        optional: true,
        values: ["post", "reel", "story", "all", "auto"],
        default: "auto"
      },
      quality: {
        optional: true,
        values: ["best", "worst"],
        default: "best"
      }
    },
    
    examples: {
      post: "/api/download?url=https://www.instagram.com/p/CxamplePost&type=post",
      reel: "/api/download?url=https://www.instagram.com/reel/CxampleReel&type=reel",
      story: "/api/download?url=https://www.instagram.com/stories/username&type=story"
    },
    
    limits: {
      timeout: "30 seconds",
      max_file_size: "50 MB",
      rate_limit: "10 requests/minute",
      storage: "Temporary (5 minutes)"
    },
    
    legal: {
      warning: "Only download content you own or have permission for",
      terms: "Respect Instagram's Terms of Service",
      responsibility: "You are responsible for how you use this API"
    },
    
    support: {
      issue: "If you encounter any problems:",
      contact: "Telegram: @Aotpy",
      response_time: "Usually within 24 hours"
    },
    
    system_info: {
      platform: "Vercel Serverless",
      region: "Global CDN",
      uptime: "99.9%",
      last_updated: new Date().toISOString()
    }
  });
};
