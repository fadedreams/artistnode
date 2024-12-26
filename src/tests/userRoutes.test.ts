import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// Helper Function for HTTP Requests
const makeHttpRequest = async (options, body = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
};

// Test Cases
// test('GET /api/user/h should return server health status', async () => {
//     const response = await makeHttpRequest({
//         hostname: 'localhost',
//         port: 3000,
//         path: '/api/user/h',
//         method: 'GET',
//     });
//
//     assert.strictEqual(response.statusCode, 200);
//     assert.strictEqual(response.body.message, 'Server is healthy!');
// });

// test('POST /api/user/create should validate user creation request', async () => {
//     const requestData = JSON.stringify({
//         name: 'Test User',
//         email: 'test@example.com',
//         password: 'securePassword123!',
//     });
//
//     const response = await makeHttpRequest(
//         {
//             hostname: 'localhost',
//             port: 3000,
//             path: '/api/user/create',
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Content-Length': Buffer.byteLength(requestData),
//             },
//         },
//         requestData
//     );
//
//     if (response.statusCode === 201) {
//         // User was created successfully
//         assert.strictEqual(response.statusCode, 201);
//     } else if (response.statusCode === 400) {
//         // User already exists
//         assert.strictEqual(response.statusCode, 400);
//     } else {
//         // Unexpected status code, fail the test
//         assert.fail(`Unexpected status code: ${response.statusCode}`);
//     }
// });

let token = null; // Declare the token variable globally

test('POST /api/user/signin should authenticate user', async () => {
    const requestData = JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
    });

    const response = await makeHttpRequest(
        {
            hostname: 'localhost',
            port: 3000,
            path: '/api/user/signin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData),
            },
        },
        requestData
    );

    assert.strictEqual(response.statusCode, 200);

    token = response.body.user.user.token;  // Store token here
    // console.log("token!!!!!!!!!!!! ", token);
    assert.ok(token, 'Token should exist');
});

test('GET /api/user/isauth should verify user authentication', async () => {
    // Ensure the token is set before using it in the test
    // assert.ok(token, 'Token is missing, authentication failed');

    const response = await makeHttpRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/user/isauth',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Add the Authorization header with the token
        },
    });

    assert.strictEqual(response.statusCode, 200);
});
