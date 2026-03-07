// Package workers implements async job handlers using Asynq (Redis-backed).
// Workers are started by cmd/worker/main.go.
package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

const (
	TypeSendEmail        = "email:send"
	TypeGenerateReport   = "report:generate"
	TypeSendNotification = "notification:send"
)

// ── Email worker ──────────────────────────────────────────

type SendEmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	IsHTML  bool   `json:"is_html"`
}

func NewSendEmailTask(to, subject, body string) (*asynq.Task, error) {
	payload, err := json.Marshal(SendEmailPayload{To: to, Subject: subject, Body: body, IsHTML: true})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeSendEmail, payload), nil
}

type EmailWorker struct {
	// smtpClient would be injected here
}

func NewEmailWorker() *EmailWorker {
	return &EmailWorker{}
}

func (w *EmailWorker) ProcessTask(ctx context.Context, t *asynq.Task) error {
	var p SendEmailPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("email: invalid payload: %w", err)
	}

	// TODO: implement actual SMTP sending
	log.Printf("[email] → %s | %s", p.To, p.Subject)

	return nil
}
