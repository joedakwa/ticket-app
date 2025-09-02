# CI/CD Runner Strategy Guide

## GitHub-Hosted vs Self-Hosted EC2 Runners

### 🎯 Quick Decision Matrix

| Job Type                   | Runner Choice    | Why?                                       | Security Level |
| -------------------------- | ---------------- | ------------------------------------------ | -------------- |
| **Lint/Format/Test**       | 🟢 GitHub-Hosted | Fast, zero maintenance, stateless          | Low Risk       |
| **Security Scans**         | 🟢 GitHub-Hosted | External services, no sensitive data       | Low Risk       |
| **Docker Build (Simple)**  | 🟢 GitHub-Hosted | Quick builds, public registries            | Low Risk       |
| **Docker Build (Complex)** | 🟠 Self-Hosted   | Large cache, GPU needs, private registries | Medium Risk    |
| **Terraform Apply**        | 🟠 Self-Hosted   | AWS credentials, infrastructure access     | **High Risk**  |
| **Deploy to EKS**          | 🟠 Self-Hosted   | Private VPC, kubectl access                | **High Risk**  |
| **Deploy to Public**       | 🟢 GitHub-Hosted | Vercel, Netlify, S3 public buckets         | Low Risk       |

---

## 🏗️ Architecture Patterns by Application Type

### Pattern 1: Simple Web App (Your Ticket App)

```yaml
# .github/workflows/ticket-app.yml
jobs:
  test:
    runs-on: ubuntu-latest # GitHub-hosted
    steps:
      - name: Run Tests
      - name: Security Scan
      - name: Build Docker Image

  deploy-staging:
    runs-on: ubuntu-latest # GitHub-hosted
    steps:
      - name: Deploy to Vercel/Netlify

  deploy-production:
    runs-on: [self-hosted, deploy-runner] # EC2 if using EKS
    steps:
      - name: Deploy to EKS
```

### Pattern 2: Enterprise SaaS Platform

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest # All CI on GitHub-hosted

  infrastructure:
    runs-on: [self-hosted, infra-runner] # Terraform on EC2

  deployment:
    runs-on: [self-hosted, deploy-runner] # EKS deployment on EC2
```

### Pattern 3: AI/ML Platform (GPU Requirements)

```yaml
jobs:
  train-model:
    runs-on: [self-hosted, gpu-runner] # EC2 with GPU

  deploy-inference:
    runs-on: [self-hosted, deploy-runner] # EKS deployment
```

---

## 🔐 Security Best Practices

### GitHub-Hosted Runners (Public)

✅ **Safe for:**

- Building and testing code
- Pushing to public Docker registries
- Deploying to public platforms (Vercel, Netlify)
- Running security scans with external services

❌ **Never use for:**

- Terraform with full AWS admin access
- Direct kubectl to private EKS clusters
- Accessing internal databases or services

### Self-Hosted EC2 Runners (Private)

✅ **Required for:**

- Infrastructure as Code (Terraform)
- Private VPC deployments
- Large compute workloads
- Compliance-sensitive environments

🔧 **Setup Requirements:**

```bash
# EC2 Instance Setup
sudo yum update -y
sudo yum install -y docker git

# Install GitHub Runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure with labels
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token YOUR-TOKEN --labels infra-runner,deploy-runner
```

---

## 🚀 Real-World Implementation Examples

### Example 1: Fintech Startup

```yaml
name: Fintech CI/CD
on:
  push:
    branches: [main]

jobs:
  # Public CI jobs
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master

  # Private infrastructure
  terraform:
    runs-on: [self-hosted, infra-runner]
    steps:
      - name: Terraform Plan/Apply
        env:
          AWS_REGION: us-east-1
        run: |
          terraform plan
          terraform apply -auto-approve

  # Private deployment
  deploy:
    runs-on: [self-hosted, deploy-runner]
    needs: terraform
    steps:
      - name: Deploy to EKS
        run: |
          kubectl apply -f k8s/
```

### Example 2: AI Marketplace Platform

```yaml
name: AI Platform CI/CD
jobs:
  # Standard CI
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, backend, ai-service]
    steps:
      - name: Test ${{ matrix.service }}

  # Heavy ML workloads
  train-models:
    runs-on: [self-hosted, gpu-runner]
    steps:
      - name: Train AI Models
        run: python train.py --gpu

  # Infrastructure management
  infrastructure:
    runs-on: [self-hosted, infra-runner]
    steps:
      - name: Provision GPU Instances
        run: terraform apply -target=aws_instance.gpu_nodes
```

---

## 💰 Cost Optimization Strategies

### GitHub-Hosted Runners

- **Free Tier:** 2,000 minutes/month for public repos
- **Paid:** $0.008/minute for private repos
- **Best for:** Short-running jobs (< 30 minutes)

### Self-Hosted EC2 Runners

- **Cost:** EC2 instance pricing (24/7 or spot instances)
- **Best for:** Long-running jobs, consistent workloads
- **Optimization:** Use spot instances for non-critical jobs

### Hybrid Strategy (Recommended)

```yaml
# Use GitHub-hosted for quick jobs
quick-ci:
  runs-on: ubuntu-latest # $0.008/minute

# Use self-hosted for long jobs
heavy-build:
  runs-on: [self-hosted, heavy-runner] # EC2 cost only
```

---

## 🔧 Setup Templates for Your Projects

### Template 1: Simple Web App

```yaml
# For projects like your ticket app
name: Simple Web App CI/CD
on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
```

### Template 2: Full-Stack with Infrastructure

```yaml
# For enterprise applications
name: Full-Stack Enterprise CI/CD
jobs:
  ci:
    runs-on: ubuntu-latest
    # All testing and building

  infrastructure:
    runs-on: [self-hosted, infra-runner]
    # Terraform for AWS resources

  deploy:
    runs-on: [self-hosted, deploy-runner]
    # Kubernetes deployment
```

---

## 🎯 Recommendations for Your Use Cases

### Current Ticket App

- **Use:** Mostly GitHub-hosted runners
- **Exception:** If deploying to private EKS, add one self-hosted runner

### Future AI Agent Marketplace

- **Use:** Hybrid approach
- **GitHub-hosted:** CI/CD, testing, security scans
- **Self-hosted:** Terraform, EKS deployment, ML training

### Sentinel Core (Security Focus)

- **Use:** Primarily self-hosted runners
- **Reason:** Security compliance, private infrastructure access

This strategy scales from simple web apps to enterprise platforms while maintaining security and cost efficiency.
