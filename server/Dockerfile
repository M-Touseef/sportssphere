FROM node:20-slim

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Knowledge base should be present in the container
# If using a VPS, you might want to mount this as a volume instead
EXPOSE 5000

CMD ["node", "index.js"]
