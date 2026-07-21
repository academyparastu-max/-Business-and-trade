# Multi-stage Docker build for optimized image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build the application
COPY . .
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built distribution files and package configurations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies to keep the image lightweight
RUN npm ci --omit=dev

# Expose port 3000 (the only port accessible in this environment)
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "run", "start"]
