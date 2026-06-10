# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# API base URL baked into the bundle. Default "/api" keeps requests
# same-origin and lets nginx proxy them to the backend (no CORS needed).
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# nginx's docker entrypoint runs envsubst on /etc/nginx/templates/*.template,
# substituting ${PORT} and ${BACKEND_URL} at container start.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=3000 \
    BACKEND_URL=http://backend:8000 \
    # Required for 15-local-resolvers.envsh to export NGINX_LOCAL_RESOLVERS
    # (used by the resolver directive in nginx.conf.template)
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=on

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://localhost:${PORT}/" || exit 1
