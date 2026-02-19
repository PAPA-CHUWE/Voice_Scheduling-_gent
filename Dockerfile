FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 5000
ENV PORT=5000
CMD ["npm", "start"]
