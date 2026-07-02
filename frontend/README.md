# TraceAgent Frontend

This frontend powers the TraceAgent web experience for authentication, incident submission, analytics, history, and reporting.

## Development

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The app will be available at http://localhost:3000.

## Environment

Set the API base URL before running the app:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Notes

- The frontend is designed to work with the FastAPI backend running on port 8000.
- For AWS deployments, replace the API URL with your deployed backend host or domain.
