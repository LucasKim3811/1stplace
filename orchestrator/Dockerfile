# Minimal image for orchestrator-only (no heavy EDA tools inside for speed)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install deps early for layer caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# app
COPY orchestrator.py /app/

# Default env (override at runtime)
ENV LLM_BASE_URL="http://localhost:8000/v1" \
    LLM_API_KEY="no-key" \
    PLANNER_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    PROGRAMMER_MODEL="deepseek-ai/deepseek-coder-6.7b-instruct" \
    REVIEWER_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    EVALUATOR_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    ORCH_TIMEOUT_S=120 \
    MOCK_ORCH=0

EXPOSE 8000
# Run the FastAPI server
CMD ["uvicorn", "orchestrator:app", "--host", "0.0.0.0", "--port", "8000"]
