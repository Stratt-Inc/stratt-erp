package database

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var Redis *redis.Client

func ConnectRedis(url string) (*redis.Client, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	Redis = client
	log.Println("✓ Redis connected")
	return client, nil
}
