# Minimal image for orchestrator-only (no heavy EDA tools inside for speed)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps (optional: add yosys/opensta/verilator in a separate tools image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY orchestrator.py /app/

# Default env (override in runtime)
ENV LLM_BASE_URL="http://localhost:8000/v1" \
    LLM_API_KEY="no-key" \
    PLANNER_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    PROGRAMMER_MODEL="deepseek-ai/deepseek-coder-6.7b-instruct" \
    REVIEWER_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    EVALUATOR_MODEL="mistralai/Mistral-7B-Instruct-v0.3" \
    MAX_ITERS=5

# Run a small demo (replace with your FastAPI/Celery entrypoints later)
CMD ["python", "orchestrator.py"]
