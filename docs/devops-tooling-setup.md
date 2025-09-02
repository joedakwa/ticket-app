# 🔧 DevOps Tooling Setup Guide

This guide shows how to install and configure essential DevOps tools for your CI/CD infrastructure, specifically designed to work with our [CI/CD Runner Strategy](./cicd-runner-strategy.md).

## 🎯 Integration with CI/CD Runners

This tooling setup is essential for **self-hosted EC2 runners** that need to:

- 🟠 **Infrastructure Runner**: Terraform for AWS resource management
- 🟠 **Deploy Runner**: kubectl for EKS deployments
- 🟠 **Heavy Runner**: Advanced Docker builds and caching

## 📋 Prerequisites

- Ubuntu/Debian-based Linux system
- sudo privileges
- Active AWS account with appropriate permissions

---

## 🛠️ Core Tool Installation

### 📦 AWS CLI v2

```bash
# Download and install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install unzip -y
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1 (or your preferred region)
# Default output format: json

# Clean up
rm -rf aws awscliv2.zip
```

### 🌍 Terraform

```bash
# Update package list and install dependencies
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common curl

# Add HashiCorp GPG key
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# Add HashiCorp repository
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list

# Install Terraform
sudo apt-get update && sudo apt-get install terraform -y

# Verify installation
terraform -version
```

### ☸️ kubectl (Kubernetes CLI)

```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Download checksum (optional but recommended)
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"

# Verify checksum (optional)
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client

# Clean up
rm kubectl kubectl.sha256
```

### ⚙️ eksctl (EKS Management Tool)

```bash
# Download eksctl
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"

# Extract and install
tar -xzf eksctl_$(uname -s)_amd64.tar.gz
sudo mv eksctl /usr/local/bin

# Verify installation
eksctl version

# Clean up
rm eksctl_$(uname -s)_amd64.tar.gz
```

---

## 🏗️ EKS Cluster Setup & Configuration

### ☸️ Configure kubeconfig for EKS

```bash
# Update kubeconfig to connect to your EKS cluster
aws eks --region us-east-1 update-kubeconfig --name your-cluster-name

# Verify connection
kubectl get nodes
kubectl cluster-info
```

### 🔐 Associate IAM OIDC Provider

This is crucial for using IAM roles with Kubernetes service accounts:

```bash
# Associate OIDC provider with your EKS cluster
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster your-cluster-name \
  --approve

# Verify OIDC provider
aws eks describe-cluster --name your-cluster-name --query "cluster.identity.oidc.issuer" --output text
```

---

## 📦 Essential EKS Add-ons

### 🛡️ EBS CSI Driver (Persistent Storage)

```bash
# Create IAM service account for EBS CSI driver
eksctl create iamserviceaccount \
  --region us-east-1 \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster your-cluster-name \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --override-existing-serviceaccounts

# Deploy EBS CSI driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/ecr/?ref=release-1.11"

# Verify deployment
kubectl get pods -n kube-system -l app=ebs-csi-controller
```

### 🌐 NGINX Ingress Controller

```bash
# Deploy NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for deployment to complete
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get LoadBalancer external IP
kubectl get service ingress-nginx-controller --namespace=ingress-nginx
```

### 🔒 cert-manager (SSL/TLS Certificates)

```bash
# Deploy cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager-cainjector
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager-webhook

# Verify cert-manager installation
kubectl get pods --namespace cert-manager
```

---

## 🤖 Self-Hosted Runner Setup

### EC2 Instance Configuration Script

Create this script for your **infrastructure runner** EC2 instance:

```bash
#!/bin/bash
# save as setup-infra-runner.sh

set -e

echo "🚀 Setting up Infrastructure Runner..."

# Update system
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Git
sudo apt-get install -y git

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install terraform -y

# Install GitHub Actions Runner
mkdir -p /home/ubuntu/actions-runner
cd /home/ubuntu/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
rm actions-runner-linux-x64-2.311.0.tar.gz

echo "✅ Infrastructure runner setup complete!"
echo "Next steps:"
echo "1. Configure the runner: ./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token YOUR-TOKEN --labels infra-runner,terraform"
echo "2. Install as service: sudo ./svc.sh install && sudo ./svc.sh start"
```

### Deploy Runner Configuration Script

Create this script for your **deploy runner** EC2 instance:

```bash
#!/bin/bash
# save as setup-deploy-runner.sh

set -e

echo "🚀 Setting up Deploy Runner..."

# Update system
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Git
sudo apt-get install -y git

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Install eksctl
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar -xzf eksctl_$(uname -s)_amd64.tar.gz
sudo mv eksctl /usr/local/bin
rm eksctl_$(uname -s)_amd64.tar.gz

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install GitHub Actions Runner
mkdir -p /home/ubuntu/actions-runner
cd /home/ubuntu/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
rm actions-runner-linux-x64-2.311.0.tar.gz

echo "✅ Deploy runner setup complete!"
echo "Next steps:"
echo "1. Configure kubeconfig: aws eks --region us-east-1 update-kubeconfig --name your-cluster-name"
echo "2. Configure the runner: ./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token YOUR-TOKEN --labels deploy-runner,kubernetes"
echo "3. Install as service: sudo ./svc.sh install && sudo ./svc.sh start"
```

---

## 🔧 Tool Verification & Testing

### Verify All Tools

```bash
#!/bin/bash
# save as verify-tools.sh

echo "🔍 Verifying DevOps tool installation..."

# AWS CLI
echo "📦 AWS CLI:"
aws --version || echo "❌ AWS CLI not installed"

# Terraform
echo "🌍 Terraform:"
terraform -version || echo "❌ Terraform not installed"

# kubectl
echo "☸️  kubectl:"
kubectl version --client || echo "❌ kubectl not installed"

# eksctl
echo "⚙️  eksctl:"
eksctl version || echo "❌ eksctl not installed"

# Docker (if applicable)
echo "🐳 Docker:"
docker --version || echo "❌ Docker not installed"

# Git
echo "📚 Git:"
git --version || echo "❌ Git not installed"

echo "✅ Tool verification complete!"
```

### Test EKS Connectivity

```bash
#!/bin/bash
# save as test-eks-connectivity.sh

echo "🧪 Testing EKS connectivity..."

# Test cluster connection
echo "📡 Testing cluster connection:"
kubectl cluster-info

# List nodes
echo "🖥️  Cluster nodes:"
kubectl get nodes

# Test EBS CSI driver
echo "💾 EBS CSI driver status:"
kubectl get pods -n kube-system -l app=ebs-csi-controller

# Test NGINX Ingress
echo "🌐 NGINX Ingress status:"
kubectl get pods -n ingress-nginx

# Test cert-manager
echo "🔒 cert-manager status:"
kubectl get pods -n cert-manager

echo "✅ EKS connectivity test complete!"
```

---

## 📋 Usage in CI/CD Pipelines

### Example: Infrastructure Pipeline

```yaml
# .github/workflows/infrastructure.yml
name: Infrastructure Management

on:
  push:
    branches: [main]
    paths: ["terraform/**"]

jobs:
  terraform:
    runs-on: [self-hosted, infra-runner]
    steps:
      - uses: actions/checkout@v4

      - name: Terraform Init
        working-directory: ./terraform
        run: terraform init

      - name: Terraform Plan
        working-directory: ./terraform
        run: terraform plan -out=plan.out

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        working-directory: ./terraform
        run: terraform apply plan.out
```

### Example: Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to EKS

on:
  workflow_run:
    workflows: ["Build and Push"]
    types: [completed]

jobs:
  deploy:
    runs-on: [self-hosted, deploy-runner]
    steps:
      - uses: actions/checkout@v4

      - name: Update kubeconfig
        run: aws eks --region us-east-1 update-kubeconfig --name your-cluster-name

      - name: Deploy to EKS
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/your-app

      - name: Verify deployment
        run: kubectl get pods -l app=your-app
```

---

## 🎯 Next Steps

1. **Choose Your Runner Strategy**: Review our [CI/CD Runner Strategy Guide](./cicd-runner-strategy.md)
2. **Set Up Infrastructure**: Use these tools to provision your AWS infrastructure
3. **Configure Runners**: Set up self-hosted runners using the provided scripts
4. **Implement Pipelines**: Create CI/CD workflows using our [Implementation Examples](./runner-implementation-examples.md)
5. **Monitor & Optimize**: Use the verification scripts to ensure everything works correctly

This tooling setup provides the foundation for a robust, scalable DevOps infrastructure that integrates seamlessly with your CI/CD runner strategy!
