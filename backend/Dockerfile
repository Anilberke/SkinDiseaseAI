FROM python:3.9

WORKDIR /app

COPY backend /app/backend

WORKDIR /app/backend

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "routes.routes:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
