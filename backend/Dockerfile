# Node.js 20 on Debian slim
FROM node:20-slim

# Install basic system dependencies if needed (not Chrome anymore)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
