# GitHub Actions Workflows

This directory contains all CI/CD workflow definitions for PingToMe.

## Workflows

### ci-quality.yml
**Trigger:** PRs and pushes to all branches
**Purpose:** Ensure code quality before deployment
**Jobs:**
- Test & Coverage
- Lint & Format
- Build Verification
- Security Scanning
- Docker Build Verification

### deploy-uat.yml
**Trigger:** Push to develop branch
**Purpose:** Automated deployment to UAT/staging
**Jobs:**
- Build API & Web containers
- Push to registry
- Scan images for vulnerabilities
- Deploy to Kubernetes
- Deploy redirector to Cloudflare Workers
- Run smoke tests
- Notify on Slack

### deploy-production.yml
**Trigger:** Push to main branch (with manual approval)
**Purpose:** Controlled production deployment with blue-green strategy
**Jobs:**
- Check UAT health
- Build & push containers
- Scan for vulnerabilities
- Manual approval gate
- Pre-deployment checks
- Blue-green deployment (API)
- Blue-green deployment (Web)
- Deploy redirector
- Post-deployment validation
- Health monitoring
- Notifications

### security-scan.yml
**Trigger:** Daily schedule + manual trigger
**Purpose:** Continuous security monitoring
**Jobs:**
- Dependency vulnerability scan
- Container image scan
- Secret scanning
- License compliance check

## Setup Instructions

1. Create `.github/workflows/` directory
2. Copy the four YAML files into this directory
3. Update GitHub Secrets (see CICD_QUICK_REFERENCE.md)
4. Create branch protection rules
5. Test with a pull request

## Monitoring

View workflow runs at: `https://github.com/your-org/pingtome/actions`

Each workflow has:
- Build logs
- Artifact storage
- Status badges
- Failure notifications
// CI/CD test - Sat May  2 01:55:00 AM +07 2026
