# Practical Runner Implementation Examples

## 🎯 Project-Specific CI/CD Strategies

### 1. **Ticket App (Current Project)**

**Profile:** Simple web application with basic deployment needs

```yaml
# .github/workflows/ticket-app.yml
name: Ticket App CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ✅ GitHub-Hosted: Perfect for standard CI tasks
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint & Format
        run: |
          npm run lint
          npm run format:check

      - name: Run tests
        run: npm test

      - name: Security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: "security-scan-results.sarif"

      - name: Build application
        run: npm run build

  # ✅ GitHub-Hosted: Simple deployment to public services
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  # 🤔 Choice Point: GitHub-hosted vs Self-hosted for production
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: ci
    # Option A: GitHub-hosted (if using Vercel/Netlify)
    runs-on: ubuntu-latest
    # Option B: Self-hosted (if using private EKS)
    # runs-on: [self-hosted, deploy-runner]
    steps:
      - name: Deploy to Production
        # Use appropriate deployment method
```

**Recommendation:** Start with 100% GitHub-hosted runners. Only add self-hosted if you move to private infrastructure.

---

### 2. **AI Agent Marketplace (Future Project)**

**Profile:** Complex microservices with ML components and private infrastructure

```yaml
# .github/workflows/ai-marketplace.yml
name: AI Marketplace CI/CD

jobs:
  # ✅ GitHub-Hosted: Standard CI for all services
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, backend, ai-service, payment-service]
    steps:
      - uses: actions/checkout@v4
      - name: Test ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm test

      - name: Build Docker image
        run: |
          docker build -t ${{ matrix.service }}:${{ github.sha }} .
          docker push $ECR_REGISTRY/${{ matrix.service }}:${{ github.sha }}

  # 🟠 Self-Hosted: ML training requires GPU
  train-models:
    runs-on: [self-hosted, gpu-runner]
    steps:
      - name: Train AI models
        run: |
          python train.py --epochs 100 --gpu
          aws s3 cp model.pkl s3://ai-models-bucket/

  # 🟠 Self-Hosted: Infrastructure management
  infrastructure:
    runs-on: [self-hosted, infra-runner]
    steps:
      - name: Terraform plan
        run: |
          cd terraform/
          terraform plan -out=plan.out

      - name: Terraform apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply plan.out

  # 🟠 Self-Hosted: Private EKS deployment
  deploy:
    runs-on: [self-hosted, deploy-runner]
    needs: [ci, infrastructure]
    steps:
      - name: Deploy to EKS
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/ai-marketplace
```

**Recommendation:** Hybrid approach - GitHub-hosted for CI, self-hosted for infrastructure and deployment.

---

### 3. **Sentinel Core (Security-First Project)**

**Profile:** High-security application with strict compliance requirements

```yaml
# .github/workflows/sentinel-core.yml
name: Sentinel Core CI/CD

jobs:
  # 🟠 Self-Hosted: Even CI runs on controlled infrastructure
  security-ci:
    runs-on: [self-hosted, security-runner]
    steps:
      - name: Secure checkout
        uses: actions/checkout@v4

      - name: SAST scanning
        run: |
          # Internal security tools
          ./scripts/security-scan.sh

      - name: Build in isolated environment
        run: |
          docker build --network none -t sentinel-core:${{ github.sha }} .

  # 🟠 Self-Hosted: All infrastructure in private environment
  deploy-infrastructure:
    runs-on: [self-hosted, infra-runner]
    steps:
      - name: Deploy with Terraform
        run: |
          terraform apply -var="image_tag=${{ github.sha }}"

  # 🟠 Self-Hosted: Deployment to air-gapped environment
  deploy-application:
    runs-on: [self-hosted, deploy-runner]
    steps:
      - name: Deploy to secure EKS
        run: |
          kubectl apply -f manifests/
```

**Recommendation:** 100% self-hosted runners for maximum security control.

---

## 🏗️ Self-Hosted Runner Setup Guide

### EC2 Instance Configuration

#### For Infrastructure Runner (Terraform)

```bash
#!/bin/bash
# User data script for infra-runner EC2 instance

# Install basic tools
yum update -y
yum install -y git docker

# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
mv terraform /usr/local/bin/

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install GitHub runner
mkdir /home/ec2-user/actions-runner
cd /home/ec2-user/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner (run as ec2-user)
sudo -u ec2-user ./config.sh \
  --url https://github.com/YOUR-ORG/YOUR-REPO \
  --token YOUR-TOKEN \
  --labels infra-runner,terraform \
  --unattended

# Start runner as service
./svc.sh install
./svc.sh start
```

#### For Deploy Runner (kubectl)

```bash
#!/bin/bash
# User data script for deploy-runner EC2 instance

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Configure kubeconfig (using IAM role)
aws eks update-kubeconfig --region us-east-1 --name your-cluster-name

# Setup GitHub runner with deploy labels
./config.sh \
  --url https://github.com/YOUR-ORG/YOUR-REPO \
  --token YOUR-TOKEN \
  --labels deploy-runner,kubernetes \
  --unattended
```

#### For GPU Runner (ML Training)

```bash
#!/bin/bash
# User data script for gpu-runner EC2 instance (g4dn.xlarge)

# Install NVIDIA drivers
aws s3 cp --recursive s3://ec2-linux-nvidia-drivers/latest/ .
chmod +x NVIDIA-Linux-x86_64*.run
./NVIDIA-Linux-x86_64*.run --silent

# Install Docker with GPU support
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

apt-get update && apt-get install -y nvidia-container-toolkit
systemctl restart docker

# Setup GitHub runner with GPU labels
./config.sh \
  --url https://github.com/YOUR-ORG/YOUR-REPO \
  --token YOUR-TOKEN \
  --labels gpu-runner,ml-training \
  --unattended
```

---

## 💰 Cost Analysis

### Monthly Cost Comparison

| Runner Type                   | Use Case             | Monthly Cost | When to Use                  |
| ----------------------------- | -------------------- | ------------ | ---------------------------- |
| GitHub-hosted (2000 min free) | Basic CI/CD          | $0-50        | Small projects, public repos |
| t3.medium EC2 (24/7)          | Light self-hosted    | $25          | Simple infrastructure tasks  |
| t3.large EC2 (24/7)           | Standard self-hosted | $50          | Regular deployment needs     |
| c5.xlarge EC2 (24/7)          | Heavy workloads      | $140         | Large builds, enterprise     |
| g4dn.xlarge EC2 (on-demand)   | GPU training         | $400+        | ML/AI workloads              |
| g4dn.xlarge EC2 (spot)        | GPU training         | $120+        | Cost-optimized ML            |

### Cost Optimization Strategies

1. **Use Spot Instances for Non-Critical Jobs**

```yaml
# EC2 spot instance for cost savings
deploy-non-critical:
  runs-on: [self-hosted, spot-runner]
```

2. **Auto-scaling Runner Groups**

```bash
# Scale runners based on queue length
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name github-runners \
  --desired-capacity 3
```

3. **Hybrid Strategy by Environment**

```yaml
# Development: GitHub-hosted (cheap)
deploy-dev:
  runs-on: ubuntu-latest

# Production: Self-hosted (secure)
deploy-prod:
  runs-on: [self-hosted, prod-runner]
```

---

## 🔐 Security Best Practices

### GitHub-Hosted Runner Security

```yaml
# Use OIDC instead of long-lived secrets
permissions:
  id-token: write
  contents: read

steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
      role-session-name: GitHubActions
      aws-region: us-east-1
```

### Self-Hosted Runner Security

```bash
# EC2 IAM role (no hardcoded credentials)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability"
      ],
      "Resource": "*"
    }
  ]
}
```

This comprehensive guide should help you make informed decisions about runner strategies for any project type, from simple web apps to complex enterprise platforms!
