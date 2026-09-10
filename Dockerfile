# XDAW NOVA FACTORY — one-click deploy (Render / HuggingFace / Oracle / any VPS)
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY factory/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY factory/ ./factory/
WORKDIR /app/factory

# تحميل خطوط القاهرة وقت البناء (إنترنت مفتوح على الاستضافة)
RUN python -c "from pipeline.visuals import ensure_fonts; print(ensure_fonts())" || true

ENV PORT=8000
ENV FACTORY_DRY_RUN=true
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
# المصنع (خلفية) + لوحة التحكم (واجهة) في حاوية واحدة
CMD ["sh", "-c", "python -m pipeline.scheduler --every-minutes 15 --produce 3 --no-publish --tts-provider edge & exec python dashboard/app.py"]
