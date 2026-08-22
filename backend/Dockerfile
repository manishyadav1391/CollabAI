FROM python:3.11-slim

# tesseract-ocr: required by pytesseract for scanned/image-only PDF OCR
# (see app/workers/process_document.py::ocr_pdf_pages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
