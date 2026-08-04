const rateLimit = require('express-rate-limit');

// Rate limiting for roadmap generation (calls external API)
exports.roadmapLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 create roadmap requests per windowMs
  message: 'Too many roadmaps created from this IP, please try again after an hour',
});
