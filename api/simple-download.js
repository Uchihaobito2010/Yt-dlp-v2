// Simple Instagram downloader that works within Vercel limits
const DEVELOPER_INFO = {
  author: "Paras Chourasiya",
  telegram: "@Aotpy",
  contact: "For issues or questions, contact on Telegram: @Aotpy"
};

module.exports = async (req, res) => {
  res.setHeader('X-Developer', DEVELOPER_INFO.author);
  res.setHeader('X-Contact', DEVELOPER_INFO.telegram);
  
  res.json({
    service: "Instagram Downloader API",
    developer: DEVELOPER_INFO.author,
    telegram: DEVELOPER_INFO.telegram,
    status: "🟢 Operational",
    message: "API is running! Contact @Aotpy for yt-dlp setup.",
    endpoints: {
      info: "/api/simple-download",
      health: "/api/health"
    },
    note: "For full functionality, contact @Aotpy to configure yt-dlp properly",
    support: "Telegram: @Aotpy - Send message for immediate assistance"
  });
};
