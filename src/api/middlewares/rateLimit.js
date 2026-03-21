import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { RateLimitError } from "../utils/errors.js";
import { redis } from "../infrastructure/redis.js";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  keyGenerator: (req) => ipKeyGenerator(req),

  handler: (req, res, next, options) => {
    res.setHeader("Retry-After", Math.ceil(options.windowMs / 1000));
    return next(
      new RateLimitError(
        "Too many requests. Please try again later.",
      ),
    );
  },
});



