

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
domain/entities
