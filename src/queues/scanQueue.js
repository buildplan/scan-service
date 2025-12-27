const { Queue } = require('bullmq');

// Connection logic for Redis (Docker vs Local)
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
};

// Create the Queue
const scanQueue = new Queue('scan-queue', { connection });

module.exports = { scanQueue, connection };
