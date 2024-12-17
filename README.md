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


##### curl testing
```js
curl -X POST http://localhost:3000/api/user/create \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "password123", "role": "user"}'

curl -X POST http://localhost:3000/api/user/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "password123"}'

curl -X GET http://localhost:3000/api/user/isauth \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzVmZWQ1ZWFkNzA3MzM1ZGNiMjAyYzgiLCJpYXQiOjE3MzQzMzk5NDV9.hlIqWrmJjXUGEoC6dblts0du9jsbnt13iOIifMcEWwQ"


curl -X POST http://localhost:3000/api/artist/create \
    -H "Content-Type: application/json" \
    -d '{"name": "name1", "about": "about1", "gender": "gender1"}'

curl -X POST http://localhost:3000/api/artist/create \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzYxMjU4ZDEzOGZhODYyMzQ4NjM3NDkiLCJpYXQiOjE3MzQ0MjAyMjB9.0kncR7qqf7EObs-_kKzHbsRIBF3JnpQo7BMNmJuZlzo" \
    -d '{"name": "name1", "about": "about1", "gender": "gender1"}'

curl -X POST http://localhost:3000/api/artist/create \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzYxMjU4ZDEzOGZhODYyMzQ4NjM3NDkiLCJpYXQiOjE3MzQ0MjAyMjB9.0kncR7qqf7EObs-_kKzHbsRIBF3JnpQo7BMNmJuZlzo" \
    -F "file=@/home/m/Pictures/pic.jpeg" \
    -F "name=name1" \
    -F "about=about1" \
    -F "gender=gender1"

```
