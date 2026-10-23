# Build frontend stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package*.json ./
# ci, not install: install may rewrite the lockfile, and this stage's lock is what ships. The lock is
# committed here (frontend/package-lock.json, copied by the glob above) so ci has something exact to
# resolve, and it fails loudly if package.json and the lock ever disagree.
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy frontend build to where backend serves it
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
