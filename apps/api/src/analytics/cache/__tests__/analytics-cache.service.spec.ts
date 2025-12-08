import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsCacheService } from '../analytics-cache.service';

describe('AnalyticsCacheService', () => {
  let service: AnalyticsCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsCacheService],
    }).compile();

    service = module.get<AnalyticsCacheService>(AnalyticsCacheService);
  });

  afterEach(() => {
    service.clear();
  });

  afterAll(() => {
    service.onModuleDestroy();
  });

  describe('set and get', () => {
    it('should set and retrieve a value', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 5000;

      service.set(key, value, ttl);
      const retrieved = service.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should handle different data types', () => {
      service.set('string', 'test', 5000);
      service.set('number', 42, 5000);
      service.set('boolean', true, 5000);
      service.set('array', [1, 2, 3], 5000);
      service.set('object', { a: 1, b: 2 }, 5000);

      expect(service.get('string')).toBe('test');
      expect(service.get('number')).toBe(42);
      expect(service.get('boolean')).toBe(true);
      expect(service.get('array')).toEqual([1, 2, 3]);
      expect(service.get('object')).toEqual({ a: 1, b: 2 });
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const value = 'test-value';
      const ttl = 100; // 100ms

      service.set(key, value, ttl);

      // Should exist immediately
      expect(service.get(key)).toBe(value);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(service.get(key)).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      const key = 'non-expiring-key';
      const value = 'test-value';
      const ttl = 1000; // 1 second

      service.set(key, value, ttl);

      // Wait 500ms (half the TTL)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should still exist
      expect(service.get(key)).toBe(value);
    });
  });

  describe('delete', () => {
    it('should delete a specific entry', () => {
      service.set('key1', 'value1', 5000);
      service.set('key2', 'value2', 5000);

      service.delete('key1');

      expect(service.get('key1')).toBeUndefined();
      expect(service.get('key2')).toBe('value2');
    });

    it('should handle deleting non-existent key', () => {
      expect(() => service.delete('non-existent')).not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    beforeEach(() => {
      service.set('analytics:user1:link1:30', { data: 'data1' }, 5000);
      service.set('analytics:user1:link2:30', { data: 'data2' }, 5000);
      service.set('analytics:user2:link1:30', { data: 'data3' }, 5000);
      service.set('dashboard:user1:stats', { data: 'data4' }, 5000);
    });

    it('should invalidate all entries matching pattern with wildcard', () => {
      service.invalidatePattern('analytics:user1:*');

      expect(service.get('analytics:user1:link1:30')).toBeUndefined();
      expect(service.get('analytics:user1:link2:30')).toBeUndefined();
      expect(service.get('analytics:user2:link1:30')).toBeDefined();
      expect(service.get('dashboard:user1:stats')).toBeDefined();
    });

    it('should invalidate all entries for a specific prefix', () => {
      service.invalidatePattern('analytics:*');

      expect(service.get('analytics:user1:link1:30')).toBeUndefined();
      expect(service.get('analytics:user1:link2:30')).toBeUndefined();
      expect(service.get('analytics:user2:link1:30')).toBeUndefined();
      expect(service.get('dashboard:user1:stats')).toBeDefined();
    });

    it('should handle pattern with no matches', () => {
      const stats = service.getStats();
      const initialSize = stats.size;

      service.invalidatePattern('nonexistent:*');

      const newStats = service.getStats();
      expect(newStats.size).toBe(initialSize);
    });

    it('should handle exact match pattern', () => {
      service.invalidatePattern('analytics:user1:link1:30');

      expect(service.get('analytics:user1:link1:30')).toBeUndefined();
      expect(service.get('analytics:user1:link2:30')).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      service.set('key1', 'value1', 5000);
      service.set('key2', 'value2', 5000);
      service.set('key3', 'value3', 5000);

      service.clear();

      expect(service.get('key1')).toBeUndefined();
      expect(service.get('key2')).toBeUndefined();
      expect(service.get('key3')).toBeUndefined();
      expect(service.getStats().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      service.set('key1', 'value1', 5000);
      service.set('key2', 'value2', 5000);

      const stats = service.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.expired).toBe(0);
    });

    it('should count expired entries', async () => {
      service.set('key1', 'value1', 100); // Will expire
      service.set('key2', 'value2', 5000); // Won't expire

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const stats = service.getStats();

      expect(stats.size).toBe(2); // Still in map
      expect(stats.expired).toBe(1); // But marked as expired
    });
  });

  describe('cache key patterns', () => {
    it('should support standard analytics cache key pattern', () => {
      const userId = 'user123';
      const linkId = 'link456';
      const days = 30;
      const cacheKey = `analytics:${userId}:${linkId}:${days}`;

      service.set(cacheKey, { totalClicks: 100 }, 120000);

      expect(service.get(cacheKey)).toEqual({ totalClicks: 100 });
    });

    it('should support dashboard cache key pattern', () => {
      const userId = 'user123';
      const days = 30;
      const cacheKey = `analytics:${userId}:dashboard:${days}`;

      service.set(cacheKey, { totalLinks: 10 }, 300000);

      expect(service.get(cacheKey)).toEqual({ totalLinks: 10 });
    });

    it('should invalidate all user analytics on pattern match', () => {
      const userId = 'user123';

      service.set(`analytics:${userId}:link1:30`, { data: 1 }, 5000);
      service.set(`analytics:${userId}:link2:30`, { data: 2 }, 5000);
      service.set(`analytics:${userId}:dashboard:30`, { data: 3 }, 5000);

      service.invalidatePattern(`analytics:${userId}:*`);

      expect(service.get(`analytics:${userId}:link1:30`)).toBeUndefined();
      expect(service.get(`analytics:${userId}:link2:30`)).toBeUndefined();
      expect(service.get(`analytics:${userId}:dashboard:30`)).toBeUndefined();
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple sets to same key', () => {
      service.set('key', 'value1', 5000);
      service.set('key', 'value2', 5000);
      service.set('key', 'value3', 5000);

      expect(service.get('key')).toBe('value3');
    });

    it('should handle multiple operations in sequence', () => {
      service.set('key1', 'value1', 5000);
      expect(service.get('key1')).toBe('value1');

      service.delete('key1');
      expect(service.get('key1')).toBeUndefined();

      service.set('key1', 'value2', 5000);
      expect(service.get('key1')).toBe('value2');
    });
  });
});
