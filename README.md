# TraceAgent

TraceAgent is a full-stack incident intelligence platform for ingesting, validating, analyzing, and tracking software stack traces. It helps teams capture production errors, route them through background processing, visualize trends, and export structured incident reports.

## What the project includes

- User authentication, account setup, and profile management
- Incident submission and stack-trace validation
- Asynchronous queue processing for large or bursty ingestion workloads
- Dashboard analytics for incident trends and service health
- Notes, history, and exportable reports
- Docker-based local development and deployment setup

## Tech stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: FastAPI, Pydantic, Beanie, Motor
- Database: MongoDB
- Messaging: AWS SQS
- Workflow automation: n8n
- Containerization: Docker Compose

## Repository structure

```text
.
├── backend/              # FastAPI application and worker services
├── frontend/             # Next.js dashboard and auth UI
├── docs/                 # Deployment and operations notes
├── docker-compose.yml    # Local container orchestration
└── README.md             # Project overview and setup guide
```

## Prerequisites

Before you start, make sure you have:

- Docker and Docker Compose installed
- Python 3.11+
- Node.js 20+
- Access to a MongoDB instance (for example MongoDB Atlas)
- AWS credentials if you plan to use SQS-backed queue processing

## Quick start

1. Clone the repository.
2. Copy the environment templates:

```bash
copy .env.example .env
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

3. Fill in the placeholder values in the copied files with your own settings.
4. Build and start the stack:

```bash
docker compose up --build
```

5. Open the app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health
- n8n: http://localhost:5678

## Local development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

The app expects the following categories of configuration:

- MongoDB connection string via MONGO_URI
- JWT signing settings via JWT_SECRET and related values
- AWS credentials and SQS URL for the queue worker
- Frontend API base URL via NEXT_PUBLIC_API_URL
- Optional webhook URLs for n8n automation

Use the included example files as a starting point. Do not commit real secrets.

## Deployment notes

This project is designed to run on Docker-compatible hosts, including AWS EC2 instances.

Because public IP addresses on EC2 can change when an instance is stopped and restarted, it is better to use:

- an Elastic IP, or
- a registered domain with DNS

If you deploy to AWS, update the frontend API URL and any webhook endpoints to match your public host or domain. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for more details.

## Security

- Never commit .env files or secrets to the repository.
- Keep credentials in environment variables, AWS Secrets Manager, or your deployment platform secret store.
- Review the included .gitignore rules before sharing the repository.
