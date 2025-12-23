# PingToMe Deployment Guide

Comprehensive guide for deploying PingToMe to UAT and Production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Deployment Channels](#deployment-channels)
- [Prerequisites](#prerequisites)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [UAT Deployment](#uat-deployment)
- [Production Deployment](#production-deployment)
- [Manual Deployment](#manual-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PingToMe Deployment Architecture                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
│  │   GitHub    │───▶│   Actions   │───▶│      Deployment Targets     │  │
│  │  Repository │    │  Workflows  │    │                             │  │
│  └─────────────┘    └─────────────┘    │  ┌───────────────────────┐  │  │
│                                         │  │ Web (Next.js)         │  │  │
│  Branches:                              │  │ → Firebase App Hosting│  │  │
│  • develop → UAT                        │  └───────────────────────┘  │  │
│  • main → Production                    │                             │  │
│                                         │  ┌───────────────────────┐  │  │
│                                         │  │ API (NestJS)          │  │  │
│                                         │  │ → Google Cloud Run    │  │  │
│                                         │  └───────────────────────┘  │  │
│                                         │                             │  │
│                                         │  ┌───────────────────────┐  │  │
│                                         │  │ Redirector (Hono)     │  │  │
│                                         │  │ → Cloudflare Workers  │  │  │
│                                         │  └───────────────────────┘  │  │
│                                         └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Channels

| Service | Platform | Auto-scaling | UAT URL | Production URL |
|---------|----------|--------------|---------|----------------|
| **Web** | Firebase App Hosting | 1-10 instances | https://app-uat.pingto.me | https://app.pingto.me |
| **API** | Google Cloud Run | 0-100 instances | https://api-uat.pingto.me | https://api.pingto.me |
| **Redirector** | Cloudflare Workers | Edge (global) | https://uat.pingto.me | https://pingto.me |

### Workflow Files

| Service | Workflow File | Trigger |
|---------|--------------|---------|
| Web | `.github/workflows/deploy-web-firebase.yml` | Push to `develop`/`main` or manual |
| API | `.github/workflows/deploy-api-cloudrun.yml` | Push to `develop`/`main` or manual |
| Redirector | `.github/workflows/deploy-redirector.yml` | Push to `develop`/`main` or manual |

---

## Prerequisites

### 1. Google Cloud Platform (GCP)

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify projects
firebase projects:list
```

### 3. Cloudflare

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify account
wrangler whoami
```

---

## GitHub Secrets Configuration

Configure these secrets in GitHub repository settings: **Settings → Secrets and variables → Actions**

### Firebase App Hosting (Web)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `FIREBASE_PROJECT_ID_UAT` | Firebase project ID for UAT | Firebase Console → Project Settings |
| `FIREBASE_PROJECT_ID_PROD` | Firebase project ID for Production | Firebase Console → Project Settings |
| `FIREBASE_SERVICE_ACCOUNT_UAT` | Service account JSON (UAT) | See [Creating Service Account](#creating-firebase-service-account) |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Service account JSON (Prod) | See [Creating Service Account](#creating-firebase-service-account) |

### Google Cloud Run (API)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `GCP_PROJECT_ID_UAT` | GCP project ID for UAT | GCP Console → Project Info |
| `GCP_PROJECT_ID_PROD` | GCP project ID for Production | GCP Console → Project Info |
| `GCP_SA_KEY_UAT` | Service account JSON (UAT) | See [Creating GCP Service Account](#creating-gcp-service-account) |
| `GCP_SA_KEY_PROD` | Service account JSON (Prod) | See [Creating GCP Service Account](#creating-gcp-service-account) |

### Cloudflare Workers (Redirector)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers permissions | Cloudflare Dashboard → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare Dashboard → Overview (right sidebar) |

### Creating Firebase Service Account

```bash
# Create service account
gcloud iam service-accounts create firebase-deployer \
  --display-name="Firebase Deployer"

# Grant roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:firebase-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:firebase-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Create key
gcloud iam service-accounts keys create firebase-sa-key.json \
  --iam-account=firebase-deployer@PROJECT_ID.iam.gserviceaccount.com

# Copy JSON content to GitHub Secret
cat firebase-sa-key.json
```

### Creating GCP Service Account

```bash
# Create service account
gcloud iam service-accounts create cloudrun-deployer \
  --display-name="Cloud Run Deployer"

# Grant roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cloudrun-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cloudrun-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cloudrun-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create key
gcloud iam service-accounts keys create cloudrun-sa-key.json \
  --iam-account=cloudrun-deployer@PROJECT_ID.iam.gserviceaccount.com

# Copy JSON content to GitHub Secret
cat cloudrun-sa-key.json
```

---

## UAT Deployment

UAT deployments are triggered automatically when pushing to the `develop` branch.

### Automatic Deployment

```bash
# Merge feature branch to develop
git checkout develop
git merge feature/your-feature
git push origin develop

# Workflows will automatically:
# 1. Build and test the application
# 2. Deploy to UAT environment
# 3. Run health checks
```

### Manual Trigger (GitHub Actions)

1. Go to **Actions** tab in GitHub
2. Select the workflow:
   - `Deploy Web to Firebase App Hosting`
   - `Deploy API to Cloud Run`
   - `Deploy Redirector`
3. Click **Run workflow**
4. Select `uat` environment
5. Click **Run workflow**

### Verify UAT Deployment

```bash
# Check Web
curl -I https://app-uat.pingto.me

# Check API
curl https://api-uat.pingto.me/health/live
curl https://api-uat.pingto.me/health/ready

# Check Redirector
curl -I https://uat.pingto.me/health
```

---

## Production Deployment

Production deployments are triggered automatically when pushing to the `main` branch.

### Automatic Deployment

```bash
# Create PR from develop to main
gh pr create --base main --head develop --title "Release v1.x.x"

# After PR approval and merge, workflows automatically deploy to production
```

### Manual Trigger (GitHub Actions)

1. Go to **Actions** tab in GitHub
2. Select the workflow
3. Click **Run workflow**
4. Select `production` environment
5. Click **Run workflow**

### Verify Production Deployment

```bash
# Check Web
curl -I https://app.pingto.me

# Check API
curl https://api.pingto.me/health/live
curl https://api.pingto.me/health/ready

# Check Redirector
curl -I https://pingto.me/health
```

---

## Manual Deployment

### Web (Firebase App Hosting)

```bash
cd apps/web

# Build Next.js
pnpm build

# Deploy to UAT
firebase use uat
firebase apphosting:backends:deploy --project=pingtome-uat

# Deploy to Production
firebase use production
firebase apphosting:backends:deploy --project=pingtome-prod
```

### API (Google Cloud Run)

```bash
# Set project
gcloud config set project PROJECT_ID

# Build and push image
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/docker-repo/api:latest -f apps/api/Dockerfile .
docker push us-central1-docker.pkg.dev/PROJECT_ID/docker-repo/api:latest

# Deploy to Cloud Run
gcloud run deploy api-uat \
  --image=us-central1-docker.pkg.dev/PROJECT_ID/docker-repo/api:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --min-instances=0 \
  --max-instances=10
```

### Redirector (Cloudflare Workers)

```bash
cd apps/redirector

# Deploy to UAT
wrangler deploy --env uat

# Deploy to Production
wrangler deploy --env production
```

---

## Rollback Procedures

### Web (Firebase App Hosting)

```bash
# List recent deployments
firebase apphosting:backends:list --project=PROJECT_ID

# Rollback via Firebase Console
# Go to Firebase Console → App Hosting → Rollouts → Select previous version
```

### API (Cloud Run)

```bash
# List revisions
gcloud run revisions list --service=api-prod --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic api-prod \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1

# Example: Rollback to previous revision
PREV_REVISION=$(gcloud run revisions list \
  --service=api-prod \
  --region=us-central1 \
  --format='value(name)' \
  --sort-by='~creationTimestamp' \
  --limit=2 | tail -1)

gcloud run services update-traffic api-prod \
  --to-revisions=$PREV_REVISION=100 \
  --region=us-central1
```

### Redirector (Cloudflare Workers)

```bash
# Rollback via Cloudflare Dashboard
# Go to Workers & Pages → pingtome-redirector → Deployments → Rollback

# Or redeploy previous commit
git checkout PREVIOUS_COMMIT
cd apps/redirector
wrangler deploy --env production
```

---

## Monitoring & Health Checks

### Service URLs

| Environment | Web | API | Redirector |
|-------------|-----|-----|------------|
| **UAT** | https://app-uat.pingto.me | https://api-uat.pingto.me | https://uat.pingto.me |
| **Production** | https://app.pingto.me | https://api.pingto.me | https://pingto.me |

### Health Check Endpoints

```bash
# API Health Checks
GET /health/live    # Liveness probe (is the service running?)
GET /health/ready   # Readiness probe (is the service ready to accept traffic?)

# Expected Response
{
  "status": "ok",
  "timestamp": "2025-12-23T15:00:00.000Z"
}
```

### Monitoring Dashboards

| Service | Dashboard |
|---------|-----------|
| Web | [Firebase Console](https://console.firebase.google.com) → App Hosting |
| API | [Cloud Console](https://console.cloud.google.com/run) → Cloud Run |
| Redirector | [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages |

---

## Troubleshooting

### Web (Firebase App Hosting)

| Issue | Solution |
|-------|----------|
| Deployment fails with auth error | Verify `FIREBASE_SERVICE_ACCOUNT_*` secrets are valid JSON |
| Build fails | Check Next.js build logs, ensure `output: 'standalone'` in next.config.js |
| Health check fails | Verify app responds on port 3000, check startup logs |

```bash
# Check deployment logs
firebase apphosting:backends:logs --project=PROJECT_ID

# Verify project configuration
firebase projects:list
```

### API (Cloud Run)

| Issue | Solution |
|-------|----------|
| Image push fails | Verify Artifact Registry permissions, check `GCP_SA_KEY_*` |
| Service not starting | Check container logs, verify PORT env var is 3000 |
| Health check fails | Ensure `/health/live` and `/health/ready` endpoints exist |

```bash
# Check service logs
gcloud run services logs read api-uat --region=us-central1

# Check service status
gcloud run services describe api-uat --region=us-central1

# Check revisions
gcloud run revisions list --service=api-uat --region=us-central1
```

### Redirector (Cloudflare Workers)

| Issue | Solution |
|-------|----------|
| Deployment fails | Verify `CLOUDFLARE_API_TOKEN` has Workers permissions |
| KV not working | Check KV namespace IDs in wrangler.toml match actual IDs |
| Routes not matching | Verify route patterns and zone_name in wrangler.toml |

```bash
# Check deployment status
wrangler deployments list

# Tail logs
wrangler tail --env uat

# Check KV namespaces
wrangler kv:namespace list
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check branch name matches trigger, verify path filters |
| Secrets not found | Ensure secret names match exactly (case-sensitive) |
| Permission denied | Verify service account roles and permissions |

---

## Environment Configuration

### UAT Environment

| Config | Value |
|--------|-------|
| API URL | https://api-uat.pingto.me |
| App URL | https://app-uat.pingto.me |
| Cloud Run Min Instances | 0 |
| Cloud Run Max Instances | 10 |
| Cloud Run CPU | 1 |
| Cloud Run Memory | 512Mi |

### Production Environment

| Config | Value |
|--------|-------|
| API URL | https://api.pingto.me |
| App URL | https://app.pingto.me |
| Cloud Run Min Instances | 1 |
| Cloud Run Max Instances | 100 |
| Cloud Run CPU | 4 |
| Cloud Run Memory | 4Gi |

---

## Quick Reference

### Deploy to UAT

```bash
git push origin develop
```

### Deploy to Production

```bash
git checkout main
git merge develop
git push origin main
```

### Check Deployment Status

```bash
# GitHub Actions
gh run list --workflow=deploy-web-firebase.yml
gh run list --workflow=deploy-api-cloudrun.yml
gh run list --workflow=deploy-redirector.yml
```

### Emergency Rollback

```bash
# API - Immediate rollback
gcloud run services update-traffic api-prod \
  --to-revisions=$(gcloud run revisions list --service=api-prod --region=us-central1 --format='value(name)' --sort-by='~creationTimestamp' --limit=2 | tail -1)=100 \
  --region=us-central1
```

---

## Related Documentation

- [generated-docs/INDEX.md](generated-docs/INDEX.md) - Complete documentation index
- [generated-docs/firebase/](generated-docs/firebase/) - Firebase App Hosting docs
- [generated-docs/cloudrun/](generated-docs/cloudrun/) - Cloud Run docs
- [generated-docs/cloudflare/](generated-docs/cloudflare/) - Cloudflare Workers docs
- [generated-docs/cicd/](generated-docs/cicd/) - CI/CD pipeline docs
