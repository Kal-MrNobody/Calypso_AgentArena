# ---- Stage 1: Build ----
FROM python:3.11-slim AS builder
WORKDIR /build

# Install deps in a virtual env for clean separation
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix="/install" -r requirements.txt

# ---- Stage 2: Runtime ----
FROM python:3.11-slim AS runtime
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy installed packages from the builder
COPY --from=builder /install /usr/local
COPY main.py index.html ./

# Switch to non-root user
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"

CMD ["python", "main.py"]
