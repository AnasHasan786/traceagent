# Deployment guide

## AWS EC2 deployment

TraceAgent is deployed successfully on AWS EC2 using Docker Compose, MongoDB Atlas, AWS SQS, and n8n.

## Actual deployed architecture

- EC2 runs the backend, frontend, worker, and n8n together.
- MongoDB Atlas is used as the persistent database.
- AWS SQS is used for asynchronous incident ingestion.
- n8n is used for registration and password reset email workflows.
- Nginx proxies frontend and backend traffic on the EC2 host.

## EC2 launch checklist

1. Launch an EC2 instance.
   - AMI: Ubuntu Server 24.04 LTS (64-bit x86)
   - Instance type: t3.micro or t3.small
   - Key pair: reuse your existing `traceagent-key.pem`
   - Security group: allow only these inbound ports:
     - SSH: 22 from your current IP
     - HTTP: 80 from anywhere
     - HTTPS: 443 from anywhere
   - Storage: 20 GB gp3

2. If you want a stable public IP, allocate and associate an Elastic IP.
   - If you skip Elastic IP, expect the public IP to change after every stop/start.
   - Update `NEXT_PUBLIC_API_URL` in `.env` whenever the public IP changes.

## Server setup

After SSHing into the instance, run:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo apt install -y docker-compose-plugin nginx git
newgrp docker
```

## Clone the repo

```bash
git clone https://github.com/AnasHasan786/traceagent.git
cd traceagent
```

## Create the environment file on the server

Create `./.env` on the EC2 host and populate it with your actual secrets.

```env
MONGO_URI=your-atlas-connection-string
JWT_SECRET=your-long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
SQS_QUEUE_URL=your-sqs-queue-url
GROQ_API_KEY=your-groq-api-key
NEXT_PUBLIC_API_URL=http://<your-ec2-ip>/api/v1
N8N_REGISTER_WEBHOOK=http://traceagent-n8n:5678/webhook/register
N8N_FORGOT_PASSWORD_WEBHOOK=http://traceagent-n8n:5678/webhook/forgot-password
MAX_LOG_CHARS=6000
MAX_OUTPUT_TOKENS=2000
```

### Important note

- `N8N_REGISTER_WEBHOOK` and `N8N_FORGOT_PASSWORD_WEBHOOK` should use the internal Docker service name `traceagent-n8n`.
- Do not commit this `.env` file.

## Build and start the stack

```bash
docker compose up -d --build
```

### Recommended debugging commands

- View the frontend build live:
  ```bash
docker compose logs frontend --follow
```
- Confirm all containers:
  ```bash
docker compose ps
```
- Restart the stack if you make `.env` changes:
  ```bash
docker compose down
  docker compose up -d --build
```

## n8n access

n8n is bound to `127.0.0.1:5678` for security, so access it through an SSH tunnel from your laptop:

```bash
ssh -i ~/.ssh/traceagent-key.pem -L 5678:localhost:5678 ubuntu@<your-ec2-ip> -N
```

Then open:

```text
http://localhost:5678
```

## Post-deploy notes

- Your app is live at `http://<your-ec2-ip>` after Nginx is configured.
- If you stop/start the instance without an Elastic IP, update `NEXT_PUBLIC_API_URL`.
- If the frontend build hangs on type checking, the project is configured to skip lint and type checks during Docker build.
- Use `docker compose down` and `docker system prune -f` to reclaim space before rebuilding.

## Cost control guidance

- t3.micro is the most cost-effective option.
- Use t3.small only if you want faster builds or more stable performance.
- If you stop the instance, there is no compute charge while it's stopped.
- The main fixed cost is the EBS root volume (20GB gp3), roughly $1.60/month.
- Do not leave an Elastic IP allocated if you are not using it.
