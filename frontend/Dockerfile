# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Set environment variable for production
ENV NODE_ENV production

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# Copy node_modules from builder stage is needed for runtime by `npm start`
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on (default 3000 for Next.js)
EXPOSE 3000

# Command to start the Next.js production server
CMD ["npm", "start"]