module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    service: 'Instagram Downloader API',
    endpoints: {
      download: 'GET /api/download?url=INSTAGRAM_URL',
      health: 'GET /api/health'
    },
    supportedTypes: ['post', 'reel', 'story', 'all'],
    note: 'This API uses yt-dlp for downloading Instagram media'
  });
};
