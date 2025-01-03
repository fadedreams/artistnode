# Use the official Node.js Debian image as the base image
FROM node:18-buster

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./


RUN npm add -g tsx nodemon

# Copy the source files (excluding node_modules, logs, venv directories, and other unnecessary files)
COPY src/ src/
COPY .env ./
COPY README.md ./
COPY tsconfig.json ./
COPY Dockerfile ./

# Install any additional dependencies (e.g., Prisma) if required and generate the Prisma client
RUN npm install

# Expose the application port (adjust this based on your app configuration)
EXPOSE 3000

# Command to run the app using nodemon and tsx as you do locally
CMD ["nodemon", "--watch", "src", "--ext", "ts", "--exec", "tsx", "-r", "tsconfig-paths/register", "src/app.ts"]
