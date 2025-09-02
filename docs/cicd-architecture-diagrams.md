# CI/CD Architecture Visualizations

## 🏗️ Complete CI/CD Architecture Flow

This diagram shows how experienced DevOps teams structure their CI/CD pipelines using both GitHub-hosted and self-hosted runners.

```mermaid
graph TB
    subgraph "GitHub Repository"
        PR[Pull Request]
        MAIN[Main Branch]
        RELEASE[Release Tag]
    end

    subgraph "GitHub-Hosted Runners"
        GH1["🟢 ubuntu-latest<br/>Lint & Format"]
        GH2["🟢 ubuntu-latest<br/>Unit Tests"]
        GH3["🟢 ubuntu-latest<br/>Integration Tests"]
        GH4["🟢 ubuntu-latest<br/>Security Scans<br/>(Trivy, Gitleaks, SonarQube)"]
        GH5["🟢 ubuntu-latest<br/>Docker Build & Push<br/>(to ECR/DockerHub)"]
        GH6["🟢 ubuntu-latest<br/>Deploy to Public<br/>(Vercel, Netlify, S3)"]
    end

    subgraph "Self-Hosted EC2 Runners"
        EC2_1["🟠 infra-runner<br/>Terraform Plan/Apply<br/>AWS IAM Role"]
        EC2_2["🟠 deploy-runner<br/>kubectl Deploy to EKS<br/>Private VPC Access"]
        EC2_3["🟠 heavy-runner<br/>GPU/Large Builds<br/>Docker Cache"]
    end

    subgraph "AWS Infrastructure"
        subgraph "VPC - Private Subnets"
            EKS["EKS Cluster"]
            RDS["RDS Database"]
            REDIS["Redis Cache"]
        end

        subgraph "Public Subnets"
            ALB["Application Load Balancer"]
            NAT["NAT Gateway"]
        end

        ECR["ECR Registry"]
        S3["S3 Buckets"]
        IAM["IAM Roles & Policies"]
    end

    subgraph "External Services"
        VERCEL["Vercel"]
        DOCKER_HUB["Docker Hub"]
        SONAR["SonarQube Cloud"]
    end

    subgraph "ArgoCD (GitOps)"
        ARGO["ArgoCD Controller<br/>(Inside EKS)"]
        ARGO_APPS["Application Manifests"]
    end

    %% GitHub Events
    PR --> GH1
    PR --> GH2
    PR --> GH3
    PR --> GH4

    MAIN --> GH5
    MAIN --> EC2_1

    RELEASE --> GH6
    RELEASE --> EC2_2

    %% GitHub-Hosted Runner Flows
    GH4 --> SONAR
    GH5 --> ECR
    GH5 --> DOCKER_HUB
    GH6 --> VERCEL
    GH6 --> S3

    %% Self-Hosted Runner Flows
    EC2_1 --> EKS
    EC2_1 --> RDS
    EC2_1 --> IAM
    EC2_2 --> EKS
    EC2_3 --> ECR

    %% ArgoCD GitOps
    MAIN --> ARGO_APPS
    ARGO --> EKS
    ARGO_APPS --> ARGO

    %% Styling
    classDef githubRunner fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef selfHosted fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff
    classDef external fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    classDef gitops fill:#9333ea,stroke:#7c3aed,stroke-width:2px,color:#fff

    class GH1,GH2,GH3,GH4,GH5,GH6 githubRunner
    class EC2_1,EC2_2,EC2_3 selfHosted
    class EKS,RDS,REDIS,ECR,S3,IAM,ALB,NAT aws
    class VERCEL,DOCKER_HUB,SONAR external
    class ARGO,ARGO_APPS gitops
```

---

## 🎯 Decision Flow: Which Runner Should I Use?

Use this flowchart to quickly decide between GitHub-hosted and self-hosted runners for any CI/CD job.

```mermaid
graph LR
    subgraph "🔍 Decision Flow"
        START[New CI/CD Job]
        Q1{Needs AWS<br/>Credentials?}
        Q2{Accesses Private<br/>VPC/EKS?}
        Q3{Large Compute<br/>Requirements?}
        Q4{Compliance<br/>Requirements?}

        START --> Q1
        Q1 -->|Yes| Q2
        Q1 -->|No| GH_RUNNER
        Q2 -->|Yes| EC2_RUNNER
        Q2 -->|No| Q3
        Q3 -->|Yes| EC2_RUNNER
        Q3 -->|No| Q4
        Q4 -->|Yes| EC2_RUNNER
        Q4 -->|No| GH_RUNNER
    end

    subgraph "🟢 GitHub-Hosted Runners"
        GH_RUNNER["✅ Use GitHub-Hosted"]
        GH_JOBS["• Lint & Format<br/>• Unit Tests<br/>• Security Scans<br/>• Docker Build (Simple)<br/>• Deploy to Vercel/Netlify<br/>• Push to Public Registries"]
        GH_PROS["👍 Pros:<br/>• Zero maintenance<br/>• Fast setup<br/>• Always updated<br/>• Free for public repos"]
        GH_CONS["👎 Cons:<br/>• Limited compute<br/>• No private access<br/>• Security constraints"]

        GH_RUNNER --> GH_JOBS
        GH_RUNNER --> GH_PROS
        GH_RUNNER --> GH_CONS
    end

    subgraph "🟠 Self-Hosted EC2 Runners"
        EC2_RUNNER["✅ Use Self-Hosted"]
        EC2_JOBS["• Terraform Apply<br/>• kubectl to EKS<br/>• Heavy Docker Builds<br/>• GPU/ML Workloads<br/>• Compliance Jobs<br/>• Private VPC Access"]
        EC2_PROS["👍 Pros:<br/>• Full control<br/>• Private network access<br/>• Custom compute<br/>• Better caching"]
        EC2_CONS["👎 Cons:<br/>• Maintenance overhead<br/>• Security responsibility<br/>• 24/7 costs<br/>• Setup complexity"]

        EC2_RUNNER --> EC2_JOBS
        EC2_RUNNER --> EC2_PROS
        EC2_RUNNER --> EC2_CONS
    end

    %% Styling
    classDef decision fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef ec2 fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff
    classDef info fill:#f5f5f5,stroke:#666,stroke-width:1px

    class START,Q1,Q2,Q3,Q4 decision
    class GH_RUNNER,GH_JOBS,GH_PROS,GH_CONS github
    class EC2_RUNNER,EC2_JOBS,EC2_PROS,EC2_CONS ec2
```

---

## 🏢 Project-Specific Architecture Patterns

### Simple Web App (Your Ticket App)

```mermaid
graph LR
    subgraph "GitHub Repository"
        CODE[Code Push]
    end

    subgraph "GitHub-Hosted Runners"
        CI["🟢 CI Pipeline<br/>Test, Lint, Build"]
        DEPLOY["🟢 Deploy<br/>to Vercel/Netlify"]
    end

    subgraph "Public Services"
        VERCEL["Vercel<br/>Production"]
        NETLIFY["Netlify<br/>Staging"]
    end

    CODE --> CI
    CI --> DEPLOY
    DEPLOY --> VERCEL
    DEPLOY --> NETLIFY

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef public fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff

    class CI,DEPLOY github
    class VERCEL,NETLIFY public
```

### Enterprise SaaS Platform

```mermaid
graph TB
    subgraph "GitHub Repository"
        CODE[Code Push]
    end

    subgraph "GitHub-Hosted Runners"
        CI["🟢 CI Pipeline<br/>Test, Lint, Security"]
        BUILD["🟢 Docker Build<br/>Push to ECR"]
    end

    subgraph "Self-Hosted EC2 Runners"
        INFRA["🟠 Infrastructure<br/>Terraform Apply"]
        DEPLOY["🟠 Deployment<br/>kubectl to EKS"]
    end

    subgraph "AWS Infrastructure"
        EKS["EKS Cluster"]
        ECR["ECR Registry"]
        RDS["RDS Database"]
    end

    CODE --> CI
    CODE --> BUILD
    CODE --> INFRA
    CI --> DEPLOY
    BUILD --> ECR
    INFRA --> EKS
    INFRA --> RDS
    DEPLOY --> EKS
    ECR --> EKS

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef selfHosted fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff

    class CI,BUILD github
    class INFRA,DEPLOY selfHosted
    class EKS,ECR,RDS aws
```

### AI/ML Platform

```mermaid
graph TB
    subgraph "GitHub Repository"
        CODE[Code Push]
    end

    subgraph "GitHub-Hosted Runners"
        CI["🟢 CI Pipeline<br/>Test Services"]
    end

    subgraph "Self-Hosted EC2 Runners"
        GPU["🟠 GPU Runner<br/>Train ML Models"]
        INFRA["🟠 Infrastructure<br/>Terraform Apply"]
        DEPLOY["🟠 Deployment<br/>kubectl to EKS"]
    end

    subgraph "AWS Infrastructure"
        EKS["EKS Cluster<br/>Inference API"]
        S3["S3 Bucket<br/>Model Storage"]
        SAGEMAKER["SageMaker<br/>Training Jobs"]
    end

    CODE --> CI
    CODE --> GPU
    CODE --> INFRA
    CI --> DEPLOY
    GPU --> S3
    GPU --> SAGEMAKER
    INFRA --> EKS
    DEPLOY --> EKS
    S3 --> EKS

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef selfHosted fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff

    class CI github
    class GPU,INFRA,DEPLOY selfHosted
    class EKS,S3,SAGEMAKER aws
```

---

## 💰 Cost Comparison Visualization

### Monthly Runner Costs

```mermaid
graph LR
    subgraph "GitHub-Hosted"
        GH_FREE["Free Tier<br/>$0<br/>2000 min/month"]
        GH_PAID["Paid Tier<br/>$50/month<br/>6250 min/month"]
    end

    subgraph "Self-Hosted EC2"
        T3_MED["t3.medium<br/>$25/month<br/>Light workloads"]
        T3_LARGE["t3.large<br/>$50/month<br/>Standard workloads"]
        C5_XLARGE["c5.xlarge<br/>$140/month<br/>Heavy workloads"]
        GPU_SPOT["g4dn.xlarge (spot)<br/>$120/month<br/>ML training"]
        GPU_DEMAND["g4dn.xlarge<br/>$400/month<br/>ML training"]
    end

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef ec2 fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff

    class GH_FREE,GH_PAID github
    class T3_MED,T3_LARGE,C5_XLARGE,GPU_SPOT,GPU_DEMAND ec2
```

---

## 🔐 Security Architecture

### GitHub-Hosted Security Model

```mermaid
graph TB
    subgraph "GitHub Actions"
        WORKFLOW["Workflow"]
        SECRETS["GitHub Secrets"]
        OIDC["OIDC Token"]
    end

    subgraph "AWS"
        IAM_ROLE["IAM Role<br/>(No long-lived keys)"]
        SERVICES["AWS Services<br/>(Limited scope)"]
    end

    WORKFLOW --> OIDC
    OIDC --> IAM_ROLE
    IAM_ROLE --> SERVICES
    SECRETS --> WORKFLOW

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff

    class WORKFLOW,SECRETS,OIDC github
    class IAM_ROLE,SERVICES aws
```

### Self-Hosted Security Model

```mermaid
graph TB
    subgraph "Private VPC"
        EC2["EC2 Runner<br/>IAM Instance Profile"]
        EKS["EKS Cluster"]
        RDS["RDS Database"]
    end

    subgraph "GitHub"
        WORKFLOW["Workflow"]
        RUNNER_TOKEN["Runner Token"]
    end

    WORKFLOW --> RUNNER_TOKEN
    RUNNER_TOKEN --> EC2
    EC2 --> EKS
    EC2 --> RDS

    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef private fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff

    class WORKFLOW,RUNNER_TOKEN github
    class EC2,EKS,RDS private
```

---

## 🔧 DevOps Tooling Architecture

This diagram shows how the DevOps tools integrate with your CI/CD runners and AWS infrastructure.

```mermaid
graph TB
    subgraph "Development Environment"
        DEV["👨‍💻 Developer"]
        LOCAL["Local Machine<br/>• AWS CLI<br/>• kubectl<br/>• Terraform"]
    end

    subgraph "GitHub Repository"
        CODE[Code Push]
        WORKFLOWS["GitHub Workflows"]
    end

    subgraph "Self-Hosted EC2 Runners"
        subgraph "Infrastructure Runner"
            INFRA_TOOLS["🔧 Installed Tools:<br/>• AWS CLI v2<br/>• Terraform<br/>• Git<br/>• Docker"]
        end

        subgraph "Deploy Runner"
            DEPLOY_TOOLS["🔧 Installed Tools:<br/>• AWS CLI v2<br/>• kubectl<br/>• eksctl<br/>• Helm<br/>• Git<br/>• Docker"]
        end

        subgraph "Heavy/GPU Runner"
            GPU_TOOLS["🔧 Installed Tools:<br/>• Docker + GPU<br/>• NVIDIA Drivers<br/>• Python/ML Libraries<br/>• AWS CLI v2"]
        end
    end

    subgraph "AWS Infrastructure"
        subgraph "EKS Cluster"
            EKS_ADDONS["📦 Add-ons:<br/>• EBS CSI Driver<br/>• NGINX Ingress<br/>• cert-manager<br/>• OIDC Provider"]
            WORKLOADS["Application Workloads"]
        end

        subgraph "Supporting Services"
            ECR["ECR Registry"]
            EBS["EBS Volumes"]
            ALB["Application Load Balancer"]
            ACM["AWS Certificate Manager"]
        end
    end

    subgraph "External Services"
        LETSENCRYPT["Let's Encrypt<br/>(via cert-manager)"]
        DOCKER_HUB["Docker Hub"]
    end

    %% Connections
    DEV --> LOCAL
    LOCAL --> CODE
    CODE --> WORKFLOWS

    WORKFLOWS --> INFRA_TOOLS
    WORKFLOWS --> DEPLOY_TOOLS
    WORKFLOWS --> GPU_TOOLS

    INFRA_TOOLS --> EKS_ADDONS
    INFRA_TOOLS --> ECR
    INFRA_TOOLS --> EBS

    DEPLOY_TOOLS --> WORKLOADS
    DEPLOY_TOOLS --> EKS_ADDONS

    GPU_TOOLS --> ECR
    GPU_TOOLS --> DOCKER_HUB

    EKS_ADDONS --> EBS
    EKS_ADDONS --> ALB
    EKS_ADDONS --> LETSENCRYPT
    EKS_ADDONS --> ACM

    %% Styling
    classDef dev fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef github fill:#2ea043,stroke:#1a7f37,stroke-width:2px,color:#fff
    classDef runner fill:#fb8500,stroke:#d62d20,stroke-width:2px,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff
    classDef external fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff

    class DEV,LOCAL dev
    class CODE,WORKFLOWS github
    class INFRA_TOOLS,DEPLOY_TOOLS,GPU_TOOLS runner
    class EKS_ADDONS,WORKLOADS,ECR,EBS,ALB,ACM aws
    class LETSENCRYPT,DOCKER_HUB external
```

---

## 🛠️ Tool Installation Flow

This shows the sequence of setting up your DevOps environment:

```mermaid
graph TD
    START[Start Setup] --> AWS_CLI[Install AWS CLI v2]
    AWS_CLI --> AWS_CONFIG[Configure AWS Credentials]
    AWS_CONFIG --> TERRAFORM[Install Terraform]
    TERRAFORM --> KUBECTL[Install kubectl]
    KUBECTL --> EKSCTL[Install eksctl]
    EKSCTL --> EKS_CONFIG[Configure EKS Access]

    EKS_CONFIG --> OIDC[Associate OIDC Provider]
    OIDC --> EBS_SA[Create EBS CSI Service Account]
    EBS_SA --> EBS_DRIVER[Deploy EBS CSI Driver]
    EBS_DRIVER --> NGINX[Deploy NGINX Ingress]
    NGINX --> CERT_MANAGER[Deploy cert-manager]
    CERT_MANAGER --> RUNNER_SETUP[Setup GitHub Runners]
    RUNNER_SETUP --> COMPLETE[✅ Setup Complete]

    %% Styling
    classDef setup fill:#e8f5e8,stroke:#2d5a2d,stroke-width:2px
    classDef aws fill:#ff9900,stroke:#cc7a00,stroke-width:2px,color:#fff
    classDef k8s fill:#326ce5,stroke:#1a4480,stroke-width:2px,color:#fff
    classDef complete fill:#d4edda,stroke:#155724,stroke-width:2px

    class START,AWS_CONFIG,EKS_CONFIG setup
    class AWS_CLI,TERRAFORM,OIDC,EBS_SA aws
    class KUBECTL,EKSCTL,EBS_DRIVER,NGINX,CERT_MANAGER k8s
    class RUNNER_SETUP,COMPLETE complete
```

---

## 🔄 CI/CD Pipeline with Tooling Integration

This shows how the tools work together in your CI/CD pipeline:

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 Developer
    participant GH as GitHub
    participant IR as Infrastructure Runner
    participant DR as Deploy Runner
    participant EKS as EKS Cluster

    Dev->>GH: Push code changes
    GH->>IR: Trigger infrastructure job

    Note over IR: Tools: AWS CLI, Terraform
    IR->>IR: terraform plan
    IR->>IR: terraform apply
    IR->>EKS: Provision/Update infrastructure

    GH->>DR: Trigger deployment job

    Note over DR: Tools: kubectl, eksctl, helm
    DR->>DR: aws eks update-kubeconfig
    DR->>DR: kubectl apply -f k8s/
    DR->>EKS: Deploy applications

    EKS->>DR: Deployment status
    DR->>GH: Report success
    GH->>Dev: Notify completion
```

---

## 📋 How to View These Diagrams

### Option 1: GitHub (Recommended)

1. Push this file to your GitHub repository
2. View it directly on GitHub - it will render the Mermaid diagrams automatically

### Option 2: VS Code

1. Install the "Markdown Preview Mermaid Support" extension
2. Open this file in VS Code
3. Use `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to preview

### Option 3: Online Mermaid Editor

1. Copy any diagram code block
2. Go to https://mermaid.live/
3. Paste the code to see the rendered diagram

### Option 4: Export as Images

1. Use the Mermaid Live Editor
2. Click "Actions" → "Export SVG/PNG"
3. Save the diagrams as image files

These visualizations will help you quickly understand and explain your CI/CD architecture to team members, stakeholders, or when planning new projects!
