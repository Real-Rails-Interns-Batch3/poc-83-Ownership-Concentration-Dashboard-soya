# Ownership Concentration Dashboard

## Overview

Ownership Concentration Dashboard is a full-stack web application that analyzes shareholder ownership concentration, voting power, and corporate control structures for major technology companies such as NVDA, GOOG, META, and AMZN.

The project combines SEC EDGAR filings, OpenCorporates entity data, and synthetic voting-right calculations to help users understand how decision-making power is distributed among founders, investors, and different share classes.

---

## Features

### Ownership Concentration Analysis

* View major shareholders and ownership percentages.
* Analyze economic ownership distribution.

### Voting vs Economic Power

* Compare voting power against economic ownership.
* Identify super-voting share structures.

### HHI Concentration Scoring

* Calculate and display Herfindahl-Hirschman Index (HHI).
* Highlight concentration levels above regulatory thresholds.

### Control Alerts

* Display critical, high, medium, and low control-risk alerts.
* Detect founder dominance and concentrated ownership structures.

### Entity Comparison

* Compare ownership and governance metrics across multiple companies.

### Intelligence & Compliance

* Single-event replay timeline.
* Emitted fields data dictionary.
* Partner chain visualization.
* Privacy implications and mitigation guidance.

### Data Export

* Export ownership snapshots and related datasets in JSON format.

---

## Technology Stack

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* Recharts

### Backend

* FastAPI
* Python
* Pandas

### Data Sources

* SEC EDGAR
* OpenCorporates
* Synthetic voting-right data (where disclosures are incomplete)

---

## Architecture

```text
Browser
   │
   ▼
Next.js Frontend (Port 3000)
   │
   ▼
FastAPI Backend (Port 8000)
   │
   ▼
Mock / Synthetic Data
```

---

## Installation

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| GET    | /v1/ownership/holders       | Retrieve ownership holders |
| GET    | /v1/ownership/metrics       | Ownership metrics          |
| GET    | /v1/ownership/hhi           | HHI concentration scores   |
| GET    | /v1/ownership/alerts        | Control alerts             |
| GET    | /v1/ownership/share-classes | Share class information    |
| GET    | /v1/ownership/compare       | Entity comparison data     |
| GET    | /v1/ownership/summary       | Dashboard summary          |
| GET    | /v1/ownership/export        | Export dataset             |

---

## Project Structure

```text
backend/
├── main.py
├── data.py
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   ├── lib/
│   └── types/
├── package.json
└── tailwind.config.js

README.md
```

---

## Data Disclaimer

This dashboard uses synthetic voting-right and ownership-class data where public disclosures are incomplete. All synthetic values are clearly labeled and intended for demonstration purposes only.
