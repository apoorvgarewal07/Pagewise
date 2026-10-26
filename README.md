# PageWise — Enterprise Document Intelligence & RAG Platform

A production-grade Document Q&A platform built with a Python (FastAPI) RAG backend and a modern React frontend.

---

## 📁 Repository Structure

```
pagewise/
├── backend/                  # FastAPI RAG Backend Engine
│   ├── app/                  # Application code (API, Core, Ingestion, Retrieval, Pipeline, LLM)
│   ├── eval/                 # Evaluation dataset (dataset.jsonl) & run_eval.py
│   ├── tests/                # Unit test suite (parser, retrieval, session isolation, API)
│   ├── docs/                 # Architecture specifications, ADR decisions, results report
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container configuration
│   └── docker-compose.yml    # Multi-container orchestration (API + Redis)
├── frontend/                 # Modern React Frontend UI
│   ├── src/                  # React components, styles, and Lucide icons
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies & scripts
│   └── .env                  # Configured to REACT_APP_API_URL=http://localhost:8000
└── scripts/                  # Legacy/scratch test scripts and utility helpers
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
# Navigate to project root and install requirements
pip install -r backend/requirements.txt

# Start the FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup (React)
```bash
# Navigate to frontend and start the development server
cd frontend
npm start
```
The application will launch at [http://localhost:3001](http://localhost:3001).

---

## 🧪 Testing & Evaluation

### Run Unit Tests
```bash
python -m pytest backend/tests
```

### Run Empirical RAG Evaluation Harness
```bash
python backend/eval/run_eval.py
```
Outputs a full markdown report to `backend/docs/results.md`.
