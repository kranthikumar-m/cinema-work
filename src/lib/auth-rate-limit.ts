interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, RateLimitBucket>();

function getBucketKey(scope: string, key: string) {
  return `${scope}:${key}`;
}

function getOrCreateBucket(bucketKey: string, config: RateLimitConfig) {
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const nextBucket = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    buckets.set(bucketKey, nextBucket);
    return nextBucket;
  }

  return existing;
}

export function consumeRateLimit(
  scope: string,
  key: string,
  config: RateLimitConfig
) {
  const bucketKey = getBucketKey(scope, key);
  const bucket = getOrCreateBucket(bucketKey, config);

  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      retryAfterMs: Math.max(bucket.resetAt - Date.now(), 0),
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    retryAfterMs: Math.max(bucket.resetAt - Date.now(), 0),
  };
}

export function clearRateLimit(scope: string, key: string) {
  buckets.delete(getBucketKey(scope, key));
}

export function getRequestClientId(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "unknown-client"
  );
}
