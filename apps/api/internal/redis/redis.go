package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	client *redis.Client
}

func New(url string) (*Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr: url,
	})
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	log.Println("redis: connected")
	return &Client{client: client}, nil
}

func (c *Client) Publish(ctx context.Context, channel string, message interface{}) error {
	return c.client.Publish(ctx, channel, message).Err()
}

func (c *Client) Subscribe(ctx context.Context, channel string) *redis.PubSub {
	return c.client.Subscribe(ctx, channel)
}

func (c *Client) Close() error {
	return c.client.Close()
}