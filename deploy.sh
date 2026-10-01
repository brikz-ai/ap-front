#!/bin/bash
set -euo pipefail

# ============================================
# Deploy do ap-front no Cloud Run (projeto brikz-ap)
#
# Pré-requisitos:
#   - gcloud autenticado com acesso ao projeto (gcloud auth login)
#   - .env na raiz com as VITE_* (URLs dos backends, FINANCIADOR_ID e JWTs).
#     As VITE_* são embutidas no bundle público no build.
#
# Infra já existente no projeto:
#   - Artifact Registry: southamerica-east1/front
#   - Service accounts: front-build (Cloud Build) e front-run (runtime)
#   - CORS dos backends já libera as URLs do serviço ap-front
# ============================================

PROJECT_ID="${GCP_PROJECT:-brikz-ap}"
# Imagem e build ficam em southamerica-east1. O servico roda em duas regioes:
# southamerica-east1 e us-east1 (esta atende ap.brikz.ai, pois domain mapping
# do Cloud Run nao e permitido em southamerica-east1).
REGION="${REGION:-southamerica-east1}"
DEPLOY_REGIONS="${DEPLOY_REGIONS:-southamerica-east1 us-east1}"
SERVICE_NAME="${SERVICE_NAME:-ap-front}"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/front/${SERVICE_NAME}"
TAG="${TAG:-$(git rev-parse --short HEAD)-$(date +%Y%m%d%H%M)}"

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Erro: .env não encontrado na raiz (veja .env.example)." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

for v in VITE_CONTRATOS_API_BASE_URL VITE_OPTIN_API_BASE_URL VITE_AGENDA_API_BASE_URL VITE_FINANCIADOR_ID; do
  if [ -z "${!v:-}" ]; then
    echo "Erro: $v vazia no .env." >&2
    exit 1
  fi
done

echo "============================================"
echo "  Projeto: ${PROJECT_ID}"
echo "  Serviço: ${SERVICE_NAME} (${DEPLOY_REGIONS})"
echo "  Imagem:  ${IMAGE_BASE}:${TAG}"
echo "============================================"

echo "Build da imagem (Cloud Build)..."
gcloud builds submit . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --config cloudbuild.yaml \
  --substitutions="_TAG=${TAG},_CONTRATOS_URL=${VITE_CONTRATOS_API_BASE_URL},_CONTRATOS_JWT=${VITE_CONTRATOS_DEV_JWT:-},_FINANCIADOR_ID=${VITE_FINANCIADOR_ID},_OPTIN_URL=${VITE_OPTIN_API_BASE_URL},_OPTIN_JWT=${VITE_OPTIN_DEV_JWT:-},_AGENDA_URL=${VITE_AGENDA_API_BASE_URL},_AGENDA_JWT=${VITE_AGENDA_DEV_JWT:-}"

for R in ${DEPLOY_REGIONS}; do
  echo "Deploy no Cloud Run (${R})..."
  gcloud run deploy "${SERVICE_NAME}" \
    --project "${PROJECT_ID}" \
    --region "${R}" \
    --image "${IMAGE_BASE}:${TAG}" \
    --service-account "front-run@${PROJECT_ID}.iam.gserviceaccount.com" \
    --port 8080 \
    --allow-unauthenticated \
    --quiet
done

echo ""
echo "No ar em: https://ap.brikz.ai"
