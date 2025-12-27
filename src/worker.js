const { Worker } = require('bullmq');
const { connection } = require('./queues/scanQueue');
const { runDeepScan } = require('./modules/lighthouse');
const logger = require('./utils/logger');

logger.info('Worker started... waiting for jobs');

const worker = new Worker('scan-queue', async (job) => {
    const { domain } = job.data;
    logger.info(`Processing deep scan for: ${domain}`);

    const start = Date.now();
    const result = await runDeepScan(domain);
    const duration = (Date.now() - start) / 1000;

    logger.info(`Deep scan for ${domain} finished in ${duration}s`);
    return result;
}, {
    connection,
    concurrency: 2, // [TUNING] Max 2 simultaneous Lighthouse scans (adjust based on VPS RAM)
    lockDuration: 60000 // Increase lock time for slow scans
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with error ${err.message}`);
});
