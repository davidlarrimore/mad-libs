# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
COPY --from=builder /app/client/dist ./public
EXPOSE 5555
CMD ["node", "--env-file-if-exists=.env", "server.js"]
