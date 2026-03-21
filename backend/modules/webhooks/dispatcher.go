package webhooks

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EventPayload is the standard envelope sent to webhook endpoints.
type EventPayload struct {
	ID        string `json:"id"`
	Event     string `json:"event"`
	OrgID     string `json:"organization_id"`
	Timestamp string `json:"timestamp"`
	Data      any    `json:"data"`
}

// Dispatcher sends webhook events with retry logic.
type Dispatcher struct {
	db     *gorm.DB
	client *http.Client
}

func NewDispatcher(db *gorm.DB) *Dispatcher {
	return &Dispatcher{
		db:     db,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// Dispatch fires an event to all active webhooks subscribed to it for the given org.
// Runs asynchronously — caller does not block.
func (d *Dispatcher) Dispatch(orgID uuid.UUID, event string, data any) {
	go d.dispatch(orgID, event, data)
}

func (d *Dispatcher) dispatch(orgID uuid.UUID, event string, data any) {
	var hooks []Webhook
	if err := d.db.Where("tenant_id = ? AND is_active = true", orgID).Find(&hooks).Error; err != nil {
		log.Printf("[webhook] db error fetching hooks: %v", err)
		return
	}
	for _, hook := range hooks {
		var subscribed []string
		if err := json.Unmarshal(hook.Events, &subscribed); err != nil {
			continue
		}
		if !contains(subscribed, event) && !contains(subscribed, "*") {
			continue
		}
		d.fire(hook, event, orgID, data)
	}
}

func (d *Dispatcher) fire(hook Webhook, event string, orgID uuid.UUID, data any) {
	payload := EventPayload{
		ID:        uuid.New().String(),
		Event:     event,
		OrgID:     orgID.String(),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data:      data,
	}
	body, _ := json.Marshal(payload)

	delivery := &WebhookDelivery{
		ID:        uuid.New(),
		WebhookID: hook.ID,
		Event:     event,
		Payload:   string(body),
		Status:    "pending",
	}
	d.db.Create(delivery)

	backoffs := []time.Duration{0, 1 * time.Minute, 5 * time.Minute, 30 * time.Minute}
	for attempt, wait := range backoffs {
		if wait > 0 {
			time.Sleep(wait)
		}
		code, err := d.send(hook.URL, hook.Secret, body)
		delivery.AttemptCount = attempt + 1
		delivery.StatusCode = code
		if err == nil && code >= 200 && code < 300 {
			delivery.Status = "success"
			delivery.ErrorMsg = ""
			d.db.Save(delivery)
			d.db.Model(&Webhook{}).Where("id = ?", hook.ID).Updates(map[string]any{
				"last_status": "success",
				"fail_count":  0,
			})
			return
		}
		msg := fmt.Sprintf("HTTP %d", code)
		if err != nil {
			msg = err.Error()
		}
		delivery.ErrorMsg = msg
		if attempt < len(backoffs)-1 {
			next := time.Now().Add(backoffs[attempt+1])
			delivery.NextRetryAt = &next
		}
		d.db.Save(delivery)
	}

	// All retries exhausted
	delivery.Status = "failure"
	delivery.NextRetryAt = nil
	d.db.Save(delivery)
	d.db.Model(&Webhook{}).Where("id = ?", hook.ID).Updates(map[string]any{
		"last_status": "failure",
		"fail_count":  gorm.Expr("fail_count + 1"),
	})
}

func (d *Dispatcher) send(url, secret string, body []byte) (int, error) {
	req, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Axiora-Webhooks/1.0")
	if secret != "" {
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write(body)
		req.Header.Set("X-Axiora-Signature", "sha256="+hex.EncodeToString(mac.Sum(nil)))
	}
	resp, err := d.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	return resp.StatusCode, nil
}

func contains(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}
