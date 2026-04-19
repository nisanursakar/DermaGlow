FROM python:3.12-slim

WORKDIR /app

# Gerekli kütüphaneleri yüklemek için requirements.txt dosyasını kopyala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY . .

# FastAPI uygulamasını başlat (--reload hot-reload için)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
