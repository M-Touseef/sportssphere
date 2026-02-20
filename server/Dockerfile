# Use lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend code
COPY . .

# Set environment variable for port
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
