package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

type SendNotificationPayload struct {
	UserID         string `json:"user_id"`
	OrganizationID string `json:"organization_id"`
	Type           string `json:"type"` // invoice_paid, lead_assigned, stock_low, ...
	Title          string `json:"title"`
	Message        string `json:"message"`
	Link           string `json:"link,omitempty"`
}

func NewSendNotificationTask(p SendNotificationPayload) (*asynq.Task, error) {
	payload, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeSendNotification, payload), nil
}

type NotificationWorker struct{}

func NewNotificationWorker() *NotificationWorker { return &NotificationWorker{} }

func (w *NotificationWorker) ProcessTask(ctx context.Context, t *asynq.Task) error {
	var p SendNotificationPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("notification: invalid payload: %w", err)
	}

	log.Printf("[notification] → user=%s | %s: %s", p.UserID, p.Type, p.Title)

	// TODO: push to WebSocket hub, save to DB, optionally trigger email
	return nil
}
