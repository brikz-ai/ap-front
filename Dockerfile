# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
# Garantir que public/ (com massa_ur.csv, massa_contratos.csv) seja copiado antes do build
COPY public/massa_ur.csv public/massa_contratos.csv ./public/

# Variaveis VITE_* sao embutidas no bundle no build (o .env nao entra na imagem;
# ver .dockerignore). Passe via --build-arg / substitutions do Cloud Build.
ARG VITE_CONTRATOS_API_BASE_URL
ARG VITE_FINANCIADOR_ID
ARG VITE_OPTIN_API_BASE_URL
ARG VITE_AGENDA_API_BASE_URL
ARG VITE_AUTH_API_URL
ENV VITE_CONTRATOS_API_BASE_URL=$VITE_CONTRATOS_API_BASE_URL     VITE_FINANCIADOR_ID=$VITE_FINANCIADOR_ID     VITE_OPTIN_API_BASE_URL=$VITE_OPTIN_API_BASE_URL     VITE_AGENDA_API_BASE_URL=$VITE_AGENDA_API_BASE_URL     VITE_AUTH_API_URL=$VITE_AUTH_API_URL
RUN pnpm build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run uses PORT 8080 by default
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
