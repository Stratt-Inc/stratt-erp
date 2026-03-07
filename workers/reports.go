package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

type GenerateReportPayload struct {
	OrganizationID string `json:"organization_id"`
	Type           string `json:"type"` // monthly, annual, custom
	StartDate      string `json:"start_date"`
	EndDate        string `json:"end_date"`
	RequestedBy    string `json:"requested_by"`
}

func NewGenerateReportTask(orgID, reportType, start, end, userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(GenerateReportPayload{
		OrganizationID: orgID,
		Type:           reportType,
		StartDate:      start,
		EndDate:        end,
		RequestedBy:    userID,
	})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeGenerateReport, payload), nil
}

type ReportWorker struct{}

func NewReportWorker() *ReportWorker { return &ReportWorker{} }

func (w *ReportWorker) ProcessTask(ctx context.Context, t *asynq.Task) error {
	var p GenerateReportPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("report: invalid payload: %w", err)
	}

	log.Printf("[report] generating %s report for org=%s (%s→%s)", p.Type, p.OrganizationID, p.StartDate, p.EndDate)

	// TODO: query DB, generate PDF/Excel, upload to MinIO, notify user
	return nil
}
