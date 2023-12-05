## Artist Backend

The Artist Backend is a Node.js application designed for artists to upload their arts (photos/videos) and receive reviews. The application follows best practices and integrates various technologies for efficient functionality.

## Overview

- **Singleton Pattern:** The application employs the Singleton pattern to manage the database connection, promoting reusability and efficiency.

- **Role-Based Authentication/Authorization:** JWT is used for role-based authentication and authorization, ensuring secure access and actions for artists.

- **Image Storage:** Images are stored using data URIs in MongoDB and Cloudinary, providing a reliable and scalable solution for image storage.

- **MongoDB Pipeline:** MongoDB's pipeline for aggregation is utilized for data structuring, ensuring efficient data handling and processing.

- **Session Storage with Redis:** Redis is employed to store sessions, enhancing the scalability and responsiveness of the application.

## Project Structure
```plaintext
/artist/backend
|-- app.js
|-- db
|-- Dockerfile
|-- models
|-- package-lock.json
|-- router
|-- winston-logger.cjs
|-- cloud
|-- db.js
|-- node_modules
|-- prometheus
|-- t1
|-- wl
|-- controllers
|-- docker-compose.yml
|-- middlewares
|-- package.json
|-- README.md
|-- utils
```

## Getting Started
1. Explore the codebase, including controllers, middlewares, and utilities.
2. Run the application using `node app.js`.
3. Test the various features related to uploading arts and receiving reviews.

Feel free to contribute, report issues, or provide feedback. Let's collaborate to enhance and optimize the Artist Backend!
