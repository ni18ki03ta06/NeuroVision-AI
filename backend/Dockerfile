# Use official lightweight Python 3.10 image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for OpenCV, PIL, and Matplotlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install backend packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and config files
COPY main.py config.py .env.example .env ./
COPY src/ ./src/
COPY models/ ./models/

# Expose FastAPI default port
EXPOSE 8000

# Start Uvicorn ASGI server hosting on port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
