# Start from a Node.js base image with specific version
FROM node:18-slim

# Create app directory in Docker
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json and package-lock.json are copied
COPY package*.json ./

RUN npm i

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 8085 8088 9229

# CMD ["node", "dist/src/server.js"]
