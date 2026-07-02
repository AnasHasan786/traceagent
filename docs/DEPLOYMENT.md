# Deployment guide

## AWS EC2 deployment

TraceAgent can run on an AWS EC2 instance with Docker Compose.

### Recommended setup

- Use an Elastic IP or a domain name for a stable public address.
- Open the required inbound ports in the security group:
  - 3000 for the frontend
  - 8000 for the backend API
  - 5678 for n8n if you want to access the workflow UI
- Keep secrets in environment variables or AWS Secrets Manager.

### Environment values for AWS

Set the following values in your server environment or deployment platform:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
SQS_QUEUE_URL=your-sqs-queue-url
NEXT_PUBLIC_API_URL=http://YOUR_HOST_OR_DOMAIN:8000/api/v1
N8N_REGISTER_WEBHOOK=http://YOUR_HOST_OR_DOMAIN:5678/webhook/register
N8N_FORGOT_PASSWORD_WEBHOOK=http://YOUR_HOST_OR_DOMAIN:5678/webhook/forgot-password
```

### Start the stack on the server

```bash
docker compose up -d --build
```

### Important note about EC2 public IPs

If your EC2 instance is stopped and restarted, the public IP can change. If you are not using a domain or Elastic IP, update your frontend API URL and webhook URLs after each reboot.

For production use, prefer:

- an Elastic IP for a fixed address, or
- a domain name with DNS pointing to the instance
