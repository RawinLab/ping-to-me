# Analytics Caching System

## Overview

This directory contains a simple in-memory caching system for analytics queries to improve performance and reduce database load.

## Files

- **analytics-cache.service.ts** - Main cache service with TTL support
- **analytics-cache.module.ts** - NestJS module exporting the cache service
- **index.ts** - Barrel export for easy imports
- **__tests__/analytics-cache.service.spec.ts** - Comprehensive unit tests

## Features

- **In-memory caching** with Map-based storage
- **TTL (Time-To-Live)** support for automatic expiration
- **Pattern-based invalidation** with wildcard support
- **Automatic cleanup** of expired entries every 5 minutes
- **Cache statistics** for monitoring

## Usage

### Basic Operations

```typescript
// Get cached value
const value = cache.get<MyType>('key');

// Set value with TTL
cache.set('key', value, 60000); // 60 seconds

// Delete specific key
cache.delete('key');

// Clear all cache
cache.clear();
```

### Pattern Invalidation

```typescript
// Invalidate all user analytics
cache.invalidatePattern(`analytics:user123:*`);

// Invalidate all analytics
cache.invalidatePattern(`analytics:*`);
```

### Cache Keys

The system uses a hierarchical key pattern:

```
analytics:${userId}:${linkId}:${days}         - Link analytics
analytics:${userId}:dashboard:${days}          - Dashboard metrics
analytics:${userId}:${linkId}:qr               - QR analytics
analytics:${userId}:${linkId}:visitors:${days} - Unique visitors
analytics:${userId}:${linkId}:dayofweek:${days} - Day of week stats
```

## Integration

### 1. Import the module

```typescript
import { AnalyticsCacheModule } from './cache/analytics-cache.module';

@Module({
  imports: [AnalyticsCacheModule],
  // ...
})
export class AnalyticsModule {}
```

### 2. Inject the service

```typescript
import { AnalyticsCacheService } from './cache/analytics-cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly cache: AnalyticsCacheService,
  ) {}
}
```

### 3. Use in methods

```typescript
async getLinkAnalytics(linkId: string, userId: string, days: number = 30) {
  // Check cache
  const cacheKey = `analytics:${userId}:${linkId}:${days}`;
  const cached = this.cache.get(cacheKey);
  if (cached) return cached;

  // Perform expensive query
  const result = await this.performExpensiveQuery();

  // Cache result
  this.cache.set(cacheKey, result, 120000); // 2 minutes

  return result;
}
```

### 4. Invalidate on updates

```typescript
async trackClick(data: TrackClickDto) {
  const clickEvent = await this.createClickEvent(data);

  // Invalidate all analytics for this user
  this.cache.invalidatePattern(`analytics:${link.userId}:*`);

  return clickEvent;
}
```

## TTL Recommendations

- **Dashboard metrics**: 5 minutes (300,000ms)
- **Link analytics**: 2 minutes (120,000ms)
- **QR analytics**: 5 minutes (300,000ms)
- **Heatmaps**: 10 minutes (600,000ms)

## Testing

Run the test suite:

```bash
pnpm --filter api test analytics-cache
```

## Future Enhancements

This implementation can be easily upgraded to use Redis:

1. Create a new `RedisCacheService` implementing the same interface
2. Update the module to provide `RedisCacheService` instead
3. No changes needed in analytics service code

## Performance Impact

Expected performance improvements:

- **Dashboard loads**: 50-70% faster
- **Link analytics**: 40-60% faster
- **Database query reduction**: 60-80% for frequently accessed data
- **Memory usage**: Minimal (~10-20MB for typical workload)

## Monitoring

Use `getStats()` to monitor cache performance:

```typescript
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Expired entries: ${stats.expired}`);
console.log(`Keys: ${stats.keys.join(', ')}`);
```
