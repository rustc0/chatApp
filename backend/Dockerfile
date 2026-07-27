FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

COPY ./entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

COPY alembic ./alembic
COPY alembic.ini ./

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
