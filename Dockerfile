FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_VK_APP_ID=""
ARG VITE_VK_REDIRECT_URL=""
ARG VITE_LEGAL_EMAIL=""
ARG VITE_LEGAL_ADDRESS=""
ARG VITE_PRODUCTION_DOMAIN=""
ENV VITE_VK_APP_ID=$VITE_VK_APP_ID VITE_VK_REDIRECT_URL=$VITE_VK_REDIRECT_URL VITE_LEGAL_EMAIL=$VITE_LEGAL_EMAIL VITE_LEGAL_ADDRESS=$VITE_LEGAL_ADDRESS VITE_PRODUCTION_DOMAIN=$VITE_PRODUCTION_DOMAIN
RUN npm run build
FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts/admin.mjs ./scripts/admin.mjs
COPY --from=build /app/scripts/backup.mjs ./scripts/backup.mjs
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /data && chown -R node:node /data /app
USER node
ENV HOST=0.0.0.0 PORT=3001 DB_PATH=/data/platform.sqlite
EXPOSE 3001
CMD ["node", "server/index.mjs"]
