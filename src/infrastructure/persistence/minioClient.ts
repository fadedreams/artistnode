import { Client } from 'minio';

// if (!process.env.MINIO_USER || !process.env.MINIO_PASS || !process.env.MINIO_SERVER) {
//     throw new Error('MINIO_USER, MINIO_PASS, or MINIO_SERVER environment variables are not set.');
// }

// Type guard to ensure values are strings
const minioUser = process.env.MINIO_USER as string;
const minioPass = process.env.MINIO_PASS as string;
const minioServer = process.env.MINIO_SERVER as string;

// Configure MinIO client
const minioClient = new Client({
    // endPoint: minioServer,
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: minioUser,
    secretKey: minioPass,
});

export default minioClient;

