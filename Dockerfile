# ChuaOnline — Fly.io image (Node 22, single stage; build + run in one image
# to keep it simple for a temporary host).
# Build mirrors Render: `npm ci && npm run build`, then `npm start`
# (tsx server/index.ts, serves dist/ + /api + socket.io on $PORT).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
