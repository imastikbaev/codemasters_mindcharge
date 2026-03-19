#!/bin/bash
# MindCharge local quick-start script
set -e

echo "========================================="
echo "  MindCharge — Local Development Setup  "
echo "========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "Docker not found. Starting without containers..."

  # Check Postgres running
  if ! pg_isready -h localhost -p 5432 -U mindcharge &>/dev/null; then
    echo "WARNING: PostgreSQL not running at localhost:5432"
    echo "  Start it manually or run: docker run -d -p 5432:5432 -e POSTGRES_USER=mindcharge -e POSTGRES_PASSWORD=mindcharge -e POSTGRES_DB=mindcharge postgres:15-alpine"
  fi
fi

# Backend
echo ""
echo "[1/3] Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi

if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null || echo "SECRET_KEY=dev-secret-key\nDATABASE_URL=postgresql://mindcharge:mindcharge@localhost:5432/mindcharge\nOPENAI_API_KEY=" > .env
fi

echo "Running seed..."
python3 seed.py || echo "Seed already ran or DB not ready"

echo "Starting backend on :8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend
echo ""
echo "[2/3] Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
  npm install -q
fi

echo "Starting frontend on :5173..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "========================================="
echo "  MindCharge is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "  Demo accounts (password: demo1234):"
echo "    user@demo.kz        — User"
echo "    psych@demo.kz       — Psychologist"
echo "    director@demo.kz    — Director"
echo "    admin@demo.kz       — Admin"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
