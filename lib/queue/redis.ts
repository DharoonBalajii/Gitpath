import IORedis from 'ioredis';

// Shared Redis connection used by BullMQ workers and producers.
// maxRetriesPerRequest must be null for BullMQ blocking commands.
export function createRedisConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });
}

// Singleton for the API process
let _redis: IORedis | null = null;
export function getRedis(): IORedis {
  if (!_redis) _redis = createRedisConnection();
  return _redis;
}
