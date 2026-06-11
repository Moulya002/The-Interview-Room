# The Interview Room — AI Service

A FastAPI microservice that powers three AI features:

| Endpoint     | Description                                              |
| ------------ | ------------------------------------------------------- |
| `POST /summary`   | Most asked questions, common topics, difficulty summary |
| `POST /questions` | Generates mock interview questions                      |
| `POST /roadmap`   | Personalized 4-week preparation roadmap                 |

The Next.js app (`/api/ai/[feature]`) forwards collected interview experiences
to this service. If `OPENAI_API_KEY` is set, results are LLM-generated; otherwise
deterministic heuristics are used so the service always responds.

## Run locally

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional: add OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

Health check: <http://localhost:8000/>

## Request shape

```json
{
  "company": "Google",
  "role": "Software Engineer",
  "count": 8,
  "experiences": [
    {
      "company": "Google",
      "role": "Software Engineer",
      "difficulty": 7,
      "outcome": "Selected",
      "questions": ["Reverse a linked list"],
      "tags": ["dsa", "system-design"],
      "rounds": ["Phone screen", "Onsite"]
    }
  ]
}
```

## Docker

```bash
docker build -t interview-room-ai .
docker run -p 8000:8000 --env-file .env interview-room-ai
```
