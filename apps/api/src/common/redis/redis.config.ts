import type { ConnectionOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';

export const REDIS_BASE_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
};

export function getRedisBullConnectionOptions(redisUrl: string): ConnectionOptions {
  return {
    url: redisUrl,
    ...REDIS_BASE_OPTIONS,
  };
}
