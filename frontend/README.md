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

## Production build notes

The frontend is built using a multi-stage Docker image and requires the API base URL at build time.

The Dockerfile uses:

```dockerfile
RUN npm ci --legacy-peer-deps
RUN npm run build -- --no-lint
```

In addition, `next.config.ts` is configured with:

```ts
output: 'standalone',
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

## Environment

Set the API base URL before running the app:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For deployment on AWS EC2, replace this with the public EC2 host or the current public IP.

## Notes

- The frontend is designed to work with the FastAPI backend running on port 8000.
- During Docker builds on small instances, type checking and linting are skipped to avoid long build times.
- For AWS deployments, replace the API URL with your deployed backend host or domain.
