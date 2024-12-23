# Use the official Node.js Debian image as the base image
FROM node:18-buster

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./

# Install pnpm and the necessary dependencies
RUN npm install -g pnpm && pnpm install --prod

# Copy the source files (excluding node_modules, logs, venv directories, and other unnecessary files)
COPY src/ src/
COPY .env ./
OPY README.md ./

# Install any additional dependencies (e.g., Prisma) if required and generate the Prisma client
RUN pnpm install

# Expose the application port (adjust this based on your app configuration)
EXPOSE 3000

# Command to run your application
CMD ["pnpm", "start"]
