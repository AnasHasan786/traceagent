# Architecture overview

## Components

- Frontend: Next.js application that provides authentication and incident workflows.
- Backend: FastAPI service that exposes REST APIs and initializes database access.
- Worker: background service that processes queued incidents.
- Queue: AWS SQS for asynchronous incident ingestion.
- Database: MongoDB for users, incidents, notes, and OTP records.
- Automation: n8n webhooks for registration and password flows.

## Request flow

1. A user submits an incident from the frontend.
2. The backend validates and stores the data.
3. The incident is queued to SQS for asynchronous processing.
4. The worker consumes the queue and performs downstream handling.
5. Analytics and reporting endpoints return the processed incident data to the UI.
