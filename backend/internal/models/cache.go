package models

import (
	"context"
	"log"
	"time"

	"battlezone/backend/config"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func ConnectRedis() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     config.AppConfig.RedisAddr,
		Password: config.AppConfig.RedisPassword,
		DB:       0,
	})

	if _, err := RedisClient.Ping(Ctx).Result(); err != nil {
		log.Printf("Warning: Redis connection failed: %v. Caching disabled.", err)
		RedisClient = nil
		return
	}
	log.Println("Redis connected successfully")
}

func CacheSet(key, value string, expiration time.Duration) error {
	if RedisClient == nil {
		return nil
	}
	return RedisClient.Set(Ctx, key, value, expiration).Err()
}

func CacheGet(key string) (string, error) {
	if RedisClient == nil {
		return "", redis.Nil
	}
	return RedisClient.Get(Ctx, key).Result()
}

func CacheDel(key string) error {
	if RedisClient == nil {
		return nil
	}
	return RedisClient.Del(Ctx, key).Err()
}
