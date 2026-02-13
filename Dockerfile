FROM node:20-alpine

WORKDIR /app

COPY apps/refugios-mvp/package*.json ./
RUN npm install --omit=dev

COPY apps/refugios-mvp .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
