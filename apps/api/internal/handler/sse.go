package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/takeaseat/takeaseat/apps/api/internal/middleware"
	"github.com/takeaseat/takeaseat/apps/api/internal/redis"
	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
)

type AvailabilityEvent struct {
	ResourceID string `json:"resource_id"`
	During   string `json:"during"`
	Status  string `json:"status"`
}

func StreamAvailabilityWithClient(redisClient *redis.Client) http.HandlerFunc {
	return StreamAvailability(redisClient)
}

func StreamAvailability(redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tenantID := middleware.GetTenantID(r)
		if tenantID == "" {
			WriteProblem(w, r, problems.Unauthorized)
			return
		}

		resourceIDs := r.URL.Query().Get("resource_ids")
		if resourceIDs == "" {
			WriteProblem(w, r, problems.BadRequest)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")
		w.WriteHeader(http.StatusOK)

		flusher, ok := w.(http.Flusher)
		if !ok {
			return
		}

		ctx, cancel := context.WithCancel(r.Context())
		defer cancel()

		channel := fmt.Sprintf("availability:%s", tenantID)
		pubsub := redisClient.Subscribe(ctx, channel)
		defer pubsub.Close()

		ch := pubsub.Channel()
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		sendEvent := func(event AvailabilityEvent) {
			data, _ := json.Marshal(event)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}

		sendEvent(AvailabilityEvent{
			ResourceID: "connected",
			Status:    "ok",
		})

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				sendEvent(AvailabilityEvent{
					ResourceID: "",
					Status:    "ping",
				})
			case msg, ok := <-ch:
				if !ok {
					return
				}
				var event AvailabilityEvent
				if err := json.Unmarshal([]byte(msg.Payload), &event); err == nil {
					for _, rid := range parseCSV(resourceIDs) {
						if event.ResourceID == rid || rid == "" {
							sendEvent(event)
						}
					}
				}
			}
		}
	}
}

func parseCSV(s string) []string {
	if s == "" {
		return nil
	}
	var result []string
	var current string
	for _, r := range s {
		if r == ',' {
			if current != "" {
				result = append(result, current)
			}
			current = ""
		} else {
			current += string(r)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func PublishAvailability(redisClient *redis.Client, tenantID string, event AvailabilityEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	channel := fmt.Sprintf("availability:%s", tenantID)
	return redisClient.Publish(context.Background(), channel, string(data))
}