FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
USER node
ENTRYPOINT ["node", "dist/cli.js"]
