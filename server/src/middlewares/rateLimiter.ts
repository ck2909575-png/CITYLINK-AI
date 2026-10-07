import rateLimit from 'express-rate-limit';

export const analyzeRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500, // allow high throughput for emergency testing
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost',
  message: {
    status: 429,
    message: 'Too many emergency intake submissions from this IP. Please wait before submitting another report.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20000, // accommodate frequent polling across cameras, telemetry, and multiple portals
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost',
});

