"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MODULE } from "@/lib/colors";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import {
  ClipboardCheck, Trophy, RefreshCw, ChevronRight,
  CheckCircle2, XCircle, BookOpen, Timer, Award,
  Download,
} from "lucide-react";

/* ── Types ── */
interface ThemeInfo { id: string; label: string; count: number; }
interface SafeQuestion {
  id: string; theme: string; difficulty: string; text: string;
  choices: { id: string; text: string }[];
}
interface QuestionsResponse { total: number; count: number; themes: string[]; questions: SafeQuestion[]; }
interface AnswerResult {
  question_id: string; correct: boolean; choice_id: string; correct_id: string;
  explanation: string; reference: string;
}
interface CheckResponse {
  correct: number; total: number; score: number;
  certified: boolean; niveau: string; results: AnswerResult[];
}

const DIFF_COLORS: Record<string, { bg: string; color: string }> = {
  debutant:  { bg: "hsl(var(--accent) / 0.1)",     color: "hsl(var(--accent))" },
  confirme:  { bg: "hsl(var(--warning) / 0.1)",    color: "hsl(var(--warning))" },
  expert:    { bg: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" },
};
const DIFF_LABELS: Record<string, string> = { debutant: "Débutant", confirme: "Confirmé", expert: "Expert" };

type Screen = "home" | "quiz" | "results";

export default function QuizPage() {
  const { accessToken } = useAuthStore();
  const opts = { token: accessToken ?? "" };

  const [screen,       setScreen]       = useState<Screen>("home");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [selectedDiff,  setSelectedDiff]  = useState("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [answers,      setAnswers]       = useState<Record<string, string>>({}); // qid → choiceId
  const [current,      setCurrent]       = useState(0);
  const [timeLeft,     setTimeLeft]      = useState(0);
  const [showReview,   setShowReview]    = useState(false);

  /* ── Themes ── */
  const { data: themes = [] } = useQuery<ThemeInfo[]>({
    queryKey: ["quiz-themes"],
    queryFn:  () => api.get("/api/v1/quiz/themes", opts),
    enabled:  !!accessToken,
  });

  /* ── Load questions ── */
  const params = new URLSearchParams({ count: String(questionCount) });
  if (selectedTheme !== "all") params.set("theme", selectedTheme);
  if (selectedDiff  !== "all") params.set("difficulty", selectedDiff);

  const { data: qData, refetch: loadQuestions, isFetching } = useQuery<QuestionsResponse>({
    queryKey: ["quiz-questions", selectedTheme, selectedDiff, questionCount],
    queryFn:  () => api.get(`/api/v1/quiz/questions?${params}`, opts),
    enabled:  false,
  });
  const questions = qData?.questions ?? [];

  /* ── Timer ── */
  useEffect(() => {
    if (screen !== "quiz" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); handleSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, timeLeft > 0]);

  /* ── Check answers ── */
  const checkMutation = useMutation<CheckResponse, Error, void>({
    mutationFn: () => {
      const answersArr = Object.entries(answers).map(([question_id, choice_id]) => ({ question_id, choice_id }));
      return api.post("/api/v1/quiz/check", { answers: answersArr }, opts) as Promise<CheckResponse>;
    },
    onSuccess: () => setScreen("results"),
  });

  const handleSubmit = useCallback(() => {
    if (checkMutation.isPending) return;
    checkMutation.mutate();
  }, [checkMutation, answers]); // eslint-disable-line react-hooks/exhaustive-deps

  function startQuiz() {
    loadQuestions().then(() => {
      setAnswers({});
      setCurrent(0);
      setTimeLeft(questionCount * 90); // 90s per question
      setScreen("quiz");
    });
  }

  function downloadBadge() {
    const r = checkMutation.data;
    if (!r) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B5CF6"/>
        <stop offset="100%" style="stop-color:#5C93FF"/>
      </linearGradient></defs>
      <rect width="320" height="200" rx="16" fill="url(#g)"/>
      <text x="160" y="60" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">Certification Conformité CCP</text>
      <text x="160" y="110" font-family="sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${r.niveau}</text>
      <text x="160" y="145" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.9)" text-anchor="middle">Score : ${r.score} %</text>
      <text x="160" y="178" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.6)" text-anchor="middle">Axiora · ${new Date().toLocaleDateString("fr-FR")}</text>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "badge-conformite-ccp.svg"; a.click();
    URL.revokeObjectURL(url);
  }

  const result = checkMutation.data;
  const q = questions[current];

  /* ── HOME ── */
  if (screen === "home") return (
    <div className="space-y-5">
      <DemoBanner />
      <div className="pb-3" style={{ borderBottom: "1px solid hsl(var(--violet) / 0.1)" }}>
        <div className="section-header" style={{ marginBottom: 4 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.quiz, boxShadow: `0 0 6px ${MODULE.quiz}` }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Formation continue</span>
        </div>
        <h1 className="text-[22px] leading-none font-extrabold" style={{ letterSpacing: "-0.025em" }}>
          Quiz{" "}<Highlight variant="mark" color="violet">conformité CCP</Highlight>
        </h1>
        <p className="text-[13px] mt-1 text-muted-foreground">Auto-évaluation des connaissances réglementaires · Certification interne</p>
      </div>

      {/* Config */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Theme */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thème</p>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedTheme("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${selectedTheme === "all" ? "text-white" : "hover:bg-muted/50 text-muted-foreground"}`}
              style={selectedTheme === "all" ? { background: MODULE.quiz } : {}}
            >
              Tous les thèmes ({themes.reduce((s, t) => s + t.count, 0)} q.)
            </button>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${selectedTheme === t.id ? "text-white" : "hover:bg-muted/50 text-muted-foreground"}`}
                style={selectedTheme === t.id ? { background: MODULE.quiz } : {}}
              >
                {t.label} ({t.count} q.)
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Niveau</p>
          <div className="space-y-1.5">
            {["all", "debutant", "confirme", "expert"].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDiff(d)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${selectedDiff === d ? "text-white" : "hover:bg-muted/50 text-muted-foreground"}`}
                style={selectedDiff === d ? { background: MODULE.quiz } : {}}
              >
                {d === "all" ? "Tous niveaux" : DIFF_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Count + Start */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre de questions</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map(n => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${questionCount === n ? "text-white border-transparent" : "border-border text-muted-foreground"}`}
                style={questionCount === n ? { background: MODULE.quiz } : {}}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
            <p>⏱ {questionCount * 90 / 60} min · 1 pt / bonne réponse</p>
            <p>🏅 Score ≥ 80 % = certification interne</p>
          </div>
          <button
            onClick={startQuiz}
            disabled={isFetching}
            className="w-full py-2.5 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: MODULE.quiz }}
          >
            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {isFetching ? "Chargement…" : "Démarrer le quiz"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-card p-4 flex gap-3 items-start">
        <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: MODULE.quiz }} />
        <p className="text-xs text-muted-foreground">
          Les questions sont tirées de la base CCP mise à jour. Chaque réponse est accompagnée d&apos;une explication et de la référence légale.
          Formation obligatoire depuis 2022 pour les marchés &gt; 40 000 € HT.
        </p>
      </div>
    </div>
  );

  /* ── QUIZ ── */
  if (screen === "quiz" && q) {
    const answered    = Object.keys(answers).length;
    const progress    = (current / questions.length) * 100;
    const mins        = Math.floor(timeLeft / 60);
    const secs        = timeLeft % 60;
    const timerColor  = timeLeft < 30 ? "hsl(var(--destructive))" : timeLeft < 60 ? "hsl(var(--warning))" : MODULE.quiz;
    const dc          = DIFF_COLORS[q.difficulty] ?? DIFF_COLORS.debutant;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Question {current + 1} / {questions.length}</span>
            <span className="font-mono font-bold" style={{ color: timerColor }}>
              <Timer className="w-3 h-3 inline mr-1" />{mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: MODULE.quiz }} />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: dc.bg, color: dc.color }}>
              {DIFF_LABELS[q.difficulty]}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">{q.theme}</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-relaxed">{q.text}</p>
          <div className="space-y-2">
            {q.choices.map(ch => {
              const selected = answers[q.id] === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: ch.id }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selected ? "border-transparent text-white font-semibold" : "border-border text-foreground hover:bg-muted/30"
                  }`}
                  style={selected ? { background: MODULE.quiz, borderColor: "transparent" } : {}}
                >
                  <span className="font-mono text-[11px] mr-2 opacity-60">{ch.id.toUpperCase()}.</span>
                  {ch.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-4 py-2 text-xs rounded-lg border border-border text-muted-foreground disabled:opacity-40"
          >
            ← Précédente
          </button>
          <span className="text-xs text-muted-foreground">{answered} / {questions.length} répondues</span>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
              style={{ background: MODULE.quiz }}
            >
              Suivante →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={checkMutation.isPending}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white disabled:opacity-60"
              style={{ background: "hsl(var(--accent))" }}
            >
              {checkMutation.isPending ? "Correction…" : "Terminer →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── RESULTS ── */
  if (screen === "results" && result) {
    const color = result.score >= 80 ? "hsl(var(--accent))" : result.score >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Score card */}
        <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: color + "20" }}>
            {result.certified
              ? <Trophy className="w-10 h-10" style={{ color }} />
              : <ClipboardCheck className="w-10 h-10" style={{ color }} />}
          </div>
          <div>
            <p className="text-3xl font-extrabold" style={{ color }}>{result.score} %</p>
            <p className="text-sm font-semibold text-foreground mt-1">{result.niveau}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{result.correct} / {result.total} bonnes réponses</p>
          </div>
          {result.certified && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--accent))" }}>
              <Award className="w-4 h-4" /> Certification obtenue !
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => { setScreen("home"); setAnswers({}); setCurrent(0); }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-muted/50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recommencer
            </button>
            {result.certified && (
              <button
                onClick={downloadBadge}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white"
                style={{ background: MODULE.quiz }}
              >
                <Download className="w-3.5 h-3.5" /> Badge SVG
              </button>
            )}
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-muted/50"
            >
              <BookOpen className="w-3.5 h-3.5" /> {showReview ? "Masquer" : "Réviser"}
            </button>
          </div>
        </div>

        {/* Review */}
        {showReview && (
          <div className="space-y-3">
            {result.results.map((r, i) => {
              const orig = questions.find(q => q.id === r.question_id);
              return (
                <div
                  key={r.question_id}
                  className="bg-card rounded-xl border p-4 space-y-2"
                  style={{ borderColor: r.correct ? "hsl(var(--accent) / 0.3)" : "hsl(var(--destructive) / 0.3)" }}
                >
                  <div className="flex items-start gap-2">
                    {r.correct
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
                      : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--destructive))" }} />}
                    <p className="text-xs font-semibold text-foreground">{i + 1}. {orig?.text}</p>
                  </div>
                  {!r.correct && (
                    <p className="text-[11px] text-muted-foreground ml-6">
                      Votre réponse : <span className="font-semibold text-destructive">{orig?.choices.find(c => c.id === r.choice_id)?.text ?? r.choice_id}</span>
                      {" · "}Bonne réponse : <span className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{orig?.choices.find(c => c.id === r.correct_id)?.text ?? r.correct_id}</span>
                    </p>
                  )}
                  <div className="ml-6 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                    {r.explanation}
                    <span className="ml-2 font-mono text-[10px] opacity-60">{r.reference}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
