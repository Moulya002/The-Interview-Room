"""
The Interview Room — AI microservice (FastAPI).

Provides three endpoints that reason over collected interview experiences:
  POST /summary    -> most asked questions, common topics, difficulty summary
  POST /questions  -> generated mock interview questions
  POST /roadmap    -> a personalized week-by-week preparation plan

If OPENAI_API_KEY is set the endpoints use an LLM; otherwise they fall back to
deterministic heuristics so the service is always functional.
"""
from __future__ import annotations

import os
from collections import Counter
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import (
    GenerateRequest,
    SummaryResponse,
    QuestionsResponse,
    RoadmapResponse,
    RoadmapWeek,
)
import llm

load_dotenv()

app = FastAPI(title="The Interview Room AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _all_questions(req: GenerateRequest) -> List[str]:
    out: List[str] = []
    for e in req.experiences:
        out.extend([q for q in e.questions if q.strip()])
    return out


def _all_tags(req: GenerateRequest) -> List[str]:
    out: List[str] = []
    for e in req.experiences:
        out.extend([t for t in e.tags if t.strip()])
    return out


def _avg_difficulty(req: GenerateRequest) -> float:
    diffs = [e.difficulty or 0 for e in req.experiences]
    return round(sum(diffs) / len(diffs), 1) if diffs else 0.0


def _context_label(req: GenerateRequest) -> str:
    parts = [p for p in [req.role, req.company] if p]
    return " at ".join(parts) if parts else "this role"


def _corpus(req: GenerateRequest, limit: int = 40) -> str:
    lines = []
    for e in req.experiences[:limit]:
        qs = "; ".join(e.questions[:8])
        lines.append(
            f"- {e.role or '?'} @ {e.company or '?'} | difficulty {e.difficulty} "
            f"| outcome {e.outcome} | questions: {qs} | tags: {', '.join(e.tags[:8])}"
        )
    return "\n".join(lines) or "(no experiences available)"


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #
@app.get("/")
def health() -> dict:
    return {"status": "ok", "llm_enabled": llm.is_enabled()}


@app.post("/summary", response_model=SummaryResponse)
def summary(req: GenerateRequest) -> SummaryResponse:
    avg = _avg_difficulty(req)
    label = _context_label(req)

    if llm.is_enabled() and req.experiences:
        result = llm.complete_json(
            system=(
                "You are an expert technical interview coach. Analyze the "
                "provided interview experiences and respond with a JSON object "
                "with keys: mostAskedQuestions (array of strings), "
                "commonTopics (array of strings), difficultySummary (string)."
            ),
            user=(
                f"Context: {label}. Average difficulty {avg}/10.\n"
                f"Experiences:\n{_corpus(req)}"
            ),
        )
        if result:
            return SummaryResponse(
                mostAskedQuestions=result.get("mostAskedQuestions", [])[: req.count],
                commonTopics=result.get("commonTopics", [])[:8],
                difficultySummary=result.get(
                    "difficultySummary",
                    f"Average difficulty {avg}/10.",
                ),
            )

    # Heuristic fallback.
    top_q = [q for q, _ in Counter(_all_questions(req)).most_common(req.count)]
    top_t = [t for t, _ in Counter(_all_tags(req)).most_common(8)]
    return SummaryResponse(
        mostAskedQuestions=top_q,
        commonTopics=top_t,
        difficultySummary=(
            f"Average difficulty {avg}/10 across {len(req.experiences)} "
            f"experiences for {label}."
        ),
    )


@app.post("/questions", response_model=QuestionsResponse)
def questions(req: GenerateRequest) -> QuestionsResponse:
    label = _context_label(req)

    if llm.is_enabled():
        result = llm.complete_json(
            system=(
                "You are an interviewer. Generate realistic mock interview "
                "questions. Respond with a JSON object: {\"questions\": [..]}."
            ),
            user=(
                f"Generate {req.count} mock interview questions for {label}. "
                f"Base them on these real experiences:\n{_corpus(req)}"
            ),
        )
        if result and result.get("questions"):
            return QuestionsResponse(questions=result["questions"][: req.count])

    top_q = [q for q, _ in Counter(_all_questions(req)).most_common(req.count)]
    if not top_q:
        top_q = [
            "Tell me about a challenging project you led.",
            "Walk me through how you would design a scalable system.",
            "Describe a time you disagreed with a teammate.",
            "Reverse a linked list and explain the complexity.",
            "How do you approach debugging a production incident?",
        ][: req.count]
    return QuestionsResponse(questions=top_q)


@app.post("/roadmap", response_model=RoadmapResponse)
def roadmap(req: GenerateRequest) -> RoadmapResponse:
    label = _context_label(req)
    top_t = [t for t, _ in Counter(_all_tags(req)).most_common(12)]
    top_q = [q for q, _ in Counter(_all_questions(req)).most_common(8)]

    if llm.is_enabled() and req.experiences:
        result = llm.complete_json(
            system=(
                "You are a preparation coach. Build a 4-week study roadmap. "
                "Respond with JSON: {\"roadmap\": [{\"week\": int, "
                "\"focus\": str, \"topics\": [str]}]}."
            ),
            user=(
                f"Create a 4-week preparation roadmap for {label}.\n"
                f"Common topics: {', '.join(top_t)}\n"
                f"Frequent questions: {'; '.join(top_q)}"
            ),
        )
        if result and result.get("roadmap"):
            return RoadmapResponse(
                roadmap=[RoadmapWeek(**w) for w in result["roadmap"]]
            )

    return RoadmapResponse(
        roadmap=[
            RoadmapWeek(week=1, focus="Fundamentals & core concepts", topics=top_t[:3] or ["Data structures", "Algorithms"]),
            RoadmapWeek(week=2, focus="Targeted practice", topics=top_t[3:6] or ["System design basics"]),
            RoadmapWeek(week=3, focus="Mock interviews", topics=["Behavioral", "System design", "Coding under time"]),
            RoadmapWeek(week=4, focus="Company-specific review", topics=top_q[:5] or ["Review past questions"]),
        ]
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
