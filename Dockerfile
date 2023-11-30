# Use the official Node.js Alpine image
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies using pnpm
COPY package.json .
RUN npm install -g pnpm && pnpm install --only=prod

# Copy only necessary files and directories, excluding node_modules and other unwanted files
COPY utils/ utils/
COPY router/ router/
COPY models/ models/
COPY middlewares/ middlewares/
COPY db/ db/
COPY models/ models/
COPY controllers/ controllers/
COPY cloud/ cloud/

COPY .env .
COPY app.js .
COPY package.json .
COPY package-lock.json .

# Install dependencies, including Prisma, and generate Prisma client during build
RUN pnpm install

EXPOSE 3000

# Specify the command to run your application
CMD ["pnpm", "start"]
