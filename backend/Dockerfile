FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app.py .
COPY backend/attribution.py backend/gunicorn.conf.py ./
RUN mkdir /data && chown 65534:65534 /data
ENV ATTRIBUTION_DB=/data/attribution.sqlite3
USER 65534:65534
CMD ["gunicorn", "-c", "gunicorn.conf.py", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "60", "--limit-request-line", "2048", "--limit-request-fields", "30", "app:application"]
