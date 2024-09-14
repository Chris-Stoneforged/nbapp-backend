import { Request, Response, NextFunction } from 'express';

class ClientDetails {
  private hits: number;
  private resetTime: number;

  getHits(): number {
    return this.hits;
  }

  getResetTime(): number {
    return this.resetTime;
  }

  reset(newResetTime: number) {
    this.hits = 0;
    this.resetTime = newResetTime;
  }

  incrementHits() {
    this.hits += 1;
  }
}

export type RateLimitConfig = {
  hitLimit: number;
  timeOutMillis: number;
};

const clientStore: Map<string, ClientDetails> = new Map<
  string,
  ClientDetails
>();

export default function rateLimiter(config: RateLimitConfig) {
  return async function rateLimit(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const existingClient = clientStore.get(request.ip);
    if (existingClient) {
      if (Date.now() >= existingClient.getResetTime()) {
        const newTime = Date.now() + config.timeOutMillis;
        existingClient.reset(newTime);
      } else if (existingClient.getHits() >= config.hitLimit) {
        const remainingTime = existingClient.getResetTime() - Date.now();
        response
          .status(429)
          .setHeader('Retry-After', remainingTime)
          .json({ success: false, message: 'Too many requests' });
        return;
      }

      existingClient.incrementHits();
      next();
    } else {
      const client = new ClientDetails();
      client.reset(Date.now() + config.timeOutMillis / 1000);
      client.incrementHits();
      clientStore.set(request.ip, client);
      next();
    }
  };
}
