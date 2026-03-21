package quiz

import (
	"math/rand"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
)

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

// GET /quiz/questions?theme=seuils&difficulty=debutant&count=10
func (h *Handler) Questions(c *gin.Context) {
	theme      := c.Query("theme")
	difficulty := c.Query("difficulty")
	count, _   := strconv.Atoi(c.DefaultQuery("count", "10"))
	if count < 1 || count > 50 { count = 10 }

	var pool []Question
	for _, q := range Bank {
		if theme != "" && q.Theme != theme { continue }
		if difficulty != "" && q.Difficulty != difficulty { continue }
		pool = append(pool, q)
	}

	// Shuffle
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })

	if count > len(pool) { count = len(pool) }
	selected := pool[:count]

	// Strip correct flag for delivery
	type safeChoice struct {
		ID   string `json:"id"`
		Text string `json:"text"`
	}
	type safeQuestion struct {
		ID         string       `json:"id"`
		Theme      string       `json:"theme"`
		Difficulty string       `json:"difficulty"`
		Text       string       `json:"text"`
		Choices    []safeChoice `json:"choices"`
	}
	out := make([]safeQuestion, len(selected))
	for i, q := range selected {
		sc := make([]safeChoice, len(q.Choices))
		for j, ch := range q.Choices { sc[j] = safeChoice{ID: ch.ID, Text: ch.Text} }
		out[i] = safeQuestion{ID: q.ID, Theme: q.Theme, Difficulty: q.Difficulty, Text: q.Text, Choices: sc}
	}

	c.JSON(200, models.OK(gin.H{
		"total":    len(Bank),
		"count":    len(out),
		"themes":   Themes(),
		"questions": out,
	}))
}

// POST /quiz/check
// Body: { "answers": [{ "question_id": "S01", "choice_id": "c" }, ...] }
func (h *Handler) Check(c *gin.Context) {
	var req struct {
		Answers []struct {
			QuestionID string `json:"question_id"`
			ChoiceID   string `json:"choice_id"`
		} `json:"answers"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Answers) == 0 {
		c.JSON(400, models.Err("answers manquants"))
		return
	}

	// Build lookup
	qmap := make(map[string]Question)
	for _, q := range Bank { qmap[q.ID] = q }

	type AnswerResult struct {
		QuestionID  string `json:"question_id"`
		Correct     bool   `json:"correct"`
		ChoiceID    string `json:"choice_id"`
		CorrectID   string `json:"correct_id"`
		Explanation string `json:"explanation"`
		Reference   string `json:"reference"`
	}

	var results []AnswerResult
	correct := 0

	for _, ans := range req.Answers {
		q, ok := qmap[ans.QuestionID]
		if !ok { continue }
		correctID := ""
		for _, ch := range q.Choices {
			if ch.Correct { correctID = ch.ID }
		}
		isCorrect := ans.ChoiceID == correctID
		if isCorrect { correct++ }
		results = append(results, AnswerResult{
			QuestionID:  ans.QuestionID,
			Correct:     isCorrect,
			ChoiceID:    ans.ChoiceID,
			CorrectID:   correctID,
			Explanation: q.Explanation,
			Reference:   q.Reference,
		})
	}

	total    := len(results)
	score    := 0
	if total > 0 { score = correct * 100 / total }
	certified := score >= 80

	niveau := "Débutant"
	switch {
	case score >= 90: niveau = "Expert CCP"
	case score >= 80: niveau = "Acheteur confirmé"
	case score >= 60: niveau = "Praticien"
	}

	c.JSON(200, models.OK(gin.H{
		"correct":   correct,
		"total":     total,
		"score":     score,
		"certified": certified,
		"niveau":    niveau,
		"results":   results,
	}))
}

// GET /quiz/themes
func (h *Handler) ThemeList(c *gin.Context) {
	type themeInfo struct {
		ID    string `json:"id"`
		Label string `json:"label"`
		Count int    `json:"count"`
	}
	labels := map[string]string{
		"seuils":     "Seuils et montants",
		"procedures": "Procédures d'achat",
		"delais":     "Délais réglementaires",
		"documents":  "Documents contractuels",
		"rgpd":       "RGPD et données personnelles",
	}
	counts := make(map[string]int)
	for _, q := range Bank { counts[q.Theme]++ }
	var out []themeInfo
	for _, t := range Themes() {
		out = append(out, themeInfo{ID: t, Label: labels[t], Count: counts[t]})
	}
	c.JSON(200, models.OK(out))
}
