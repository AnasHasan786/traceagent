# Architecture overview

## Components

- Frontend: Next.js application that provides authentication, incident ingestion, analytics, and reporting.
- Backend: FastAPI service that exposes REST APIs and connects to MongoDB Atlas.
- Worker: background Python process that consumes AWS SQS and runs incident analysis.
- Queue: AWS SQS for decoupled asynchronous ingestion.
- Database: MongoDB Atlas for users, workspaces, incidents, notes, and OTP records.
- Workflow automation: n8n for registration and forgot-password email workflows.
- Reverse proxy: Nginx on the EC2 host for public HTTP routing.

## Request flow

1. A user interacts with the Next.js frontend in the browser.
2. The frontend calls the FastAPI backend API under `/api/v1`.
3. Registration and password reset requests trigger n8n webhooks.
4. Backend stores incident and auth data in MongoDB Atlas.
5. The backend sends incident payloads to AWS SQS for asynchronous processing.
6. The worker consumes SQS messages and performs analysis.
7. Results are saved back into MongoDB and surfaced through dashboard endpoints.

## Deployment notes

- In AWS EC2 deployments, n8n is accessed locally through an SSH tunnel for security.
- Backend webhook endpoints should use the internal Docker service name `traceagent-n8n`.
- Public frontend traffic is routed through Nginx to the frontend container.
- The backend is exposed internally on `127.0.0.1:8000` and the frontend on `127.0.0.1:3000`.

## Real deployment decisions

- The project runs on a single EC2 instance with Docker Compose.
- No external SSL or domain is required for the current demo setup.
- The frontend build uses `NEXT_PUBLIC_API_URL` baked at build time.
- The n8n workflows are configured in the server environment and are not exposed directly on the public IP.
