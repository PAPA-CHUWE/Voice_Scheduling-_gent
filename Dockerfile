# ---- Build stage ----
    FROM node:20-alpine AS build

    WORKDIR /app
    
    # Install dependencies first (better layer caching)
    COPY package.json package-lock.json* ./
    RUN npm ci
    
    # Copy source
    COPY . .
    
    # Build TypeScript -> dist/
    RUN npm run build
    
    # ---- Runtime stage ----
    FROM node:20-alpine AS runtime
    
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Install only production deps
    COPY package.json package-lock.json* ./
    RUN npm ci --omit=dev
    
    # Copy built output + any runtime assets needed
    COPY --from=build /app/dist ./dist
    
    # If you need templates/static files at runtime, copy them too:
    # COPY --from=build /app/src/modules/notifications/email/templates ./dist/modules/notifications/email/templates
    
    # Expose port Render will bind via $PORT
    EXPOSE 5000
    
    # Render sets PORT env var; your server should listen on process.env.PORT
    CMD ["node", "dist/server.js"]
    