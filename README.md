# XYZ Earthquake Risk Forecaster

A full-stack application that predicts the likelihood of significant earthquakes using recent seismic activity metrics. The project consists of a Python-based machine learning backend and a React/TypeScript frontend for user interaction.

## Project Structure

- `backend/` – data ingestion, preprocessing, model training, and FastAPI service
- `frontend/` – React UI for collecting inputs and displaying predictions

## Getting Started

### Backend setup

```zsh
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Run the API locally from the `capstone` directory root level:

```zsh
PYTHONPATH=backend .venv/bin/uvicorn src.api:app --reload --port 8000
```

### Frontend setup

```zsh
cd frontend
npm install
npm run dev
```
