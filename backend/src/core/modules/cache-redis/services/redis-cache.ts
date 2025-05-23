import { ICacheService } from "@medusajs/framework/types"
import { Redis } from "ioredis"
import { RedisCacheModuleOptions } from "../types"

const DEFAULT_NAMESPACE = "medusa"
const DEFAULT_CACHE_TIME = 30 // 30 seconds
const EXPIRY_MODE = "EX" // "EX" stands for an expiry time in second

type InjectedDependencies = {
  cacheRedisConnection: Redis
}

class RedisCacheService implements ICacheService {
  protected readonly TTL: number
  protected readonly redis: Redis
  private readonly namespace: string

  constructor(
    { cacheRedisConnection }: InjectedDependencies,
    options: RedisCacheModuleOptions = {}
  ) {
    this.redis = cacheRedisConnection
    this.TTL = options.ttl ?? DEFAULT_CACHE_TIME
    this.namespace = options.namespace || DEFAULT_NAMESPACE
  }

  __hooks = {
    onApplicationShutdown: async () => {
      this.redis.disconnect()
    },
  }

  /**
   * Set a key/value pair to the cache.
   * If the ttl is 0 it will act like the value should not be cached at all.
   * @param key
   * @param data
   * @param ttl
   */
  async set(
    key: string,
    data: Record<string, unknown>,
    ttl: number = this.TTL
  ): Promise<void> {
    if (ttl === 0) {
      return
    }

    await this.redis.set(
      this.getCacheKey(key),
      JSON.stringify(data),
      EXPIRY_MODE,
      ttl
    )
  }

  /**
   * Retrieve a cached value belonging to the given key.
   * @param cacheKey
   */
  async get<T>(cacheKey: string): Promise<T | null> {
    cacheKey = this.getCacheKey(cacheKey)
    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (err) {
      await this.redis.unlink(cacheKey)
    }
    return null
  }

  /**
   * Invalidate cache for a specific key. a key can be either a specific key or more global such as "ps:*".
   * @param key
   */
  async invalidate(key: string): Promise<void> {
    const pattern = this.getCacheKey(key)
    let cursor = "0"
    do {
      const result = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      )
      cursor = result[0]
      const keys = result[1]

      if (keys.length > 0) {
        const deletePipeline = this.redis.pipeline()
        for (const key of keys) {
          deletePipeline.unlink(key)
        }

        await deletePipeline.exec()
      }
    } while (cursor !== "0")
  }

  /**
   * Returns namespaced cache key
   * @param key
   */
  private getCacheKey(key: string) {
    return this.namespace ? `${this.namespace}:${key}` : key
  }
}

export default RedisCacheService
