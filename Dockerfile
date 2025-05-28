# Install dependencies only when needed
FROM node:20-bullseye AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Clean up any old build artifacts
RUN rm -rf node_modules/.cache .next

# Generate Prisma client (if you use Prisma)
RUN npx prisma generate || true

# Build Next.js app
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

# Set the correct permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]

