# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables to prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies if needed (e.g., for psycopg2 if not using -binary)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Copy only requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn # Install gunicorn here

# Copy the rest of the backend application code
COPY . .

# Expose the port the app runs on (defined by CMD or ENTRYPOINT)
# This should match the port Gunicorn binds to
EXPOSE 8001

# Command to run the application using Gunicorn
# The port here should match the EXPOSE instruction and the expected port
# Use 0.0.0.0 to allow connections from outside the container
# Workers can be adjusted based on expected load and CPU cores
CMD ["gunicorn", "backend.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8001"]