"""Pydantic request/response schemas shared across endpoints."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class Experience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    difficulty: Optional[int] = 5
    outcome: Optional[str] = None
    questions: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    tips: Optional[str] = ""
    rounds: List[str] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    count: int = 8
    experiences: List[Experience] = Field(default_factory=list)


class SummaryResponse(BaseModel):
    mostAskedQuestions: List[str]
    commonTopics: List[str]
    difficultySummary: str


class QuestionsResponse(BaseModel):
    questions: List[str]


class RoadmapWeek(BaseModel):
    week: int
    focus: str
    topics: List[str]


class RoadmapResponse(BaseModel):
    roadmap: List[RoadmapWeek]
