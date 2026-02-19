# ---------- Build stage ----------
    FROM node:20-alpine AS build
    WORKDIR /app
    
    COPY package.json package-lock.json* ./
    # Need dev deps here because tsc is a devDependency
    RUN npm install --no-audit --no-fund
    
    COPY . .
    RUN npm run build
    
    # ---------- Runtime stage ----------
    FROM node:20-alpine AS runtime
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY package.json package-lock.json* ./
    RUN npm install --omit=dev --no-audit --no-fund
    
    COPY --from=build /app/dist ./dist
    
    # If you need any runtime files (templates), copy them too:
    # COPY --from=build /app/src/modules/notifications/email/templates ./dist/modules/notifications/email/templates
    
    EXPOSE 5000
    CMD ["node", "dist/server.js"]
    