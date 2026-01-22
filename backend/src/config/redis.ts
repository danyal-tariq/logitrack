import { createClient } from 'redis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();


const redisConnection = {
    url: process.env.REDIS_URL as string,
    /// Why? BullMQ uses blocking commands (BRPOPLPUSH) to wait for new jobs.
    //  By default, the redis client will error out if a request stays open too long.
    //  Setting this to null is a requirement for BullMQ to remain stable during long idle periods.
    maxRetriesPerRequest: null,
}

const redisClient = createClient(redisConnection);

redisClient.on('error', (err) => logger.error({ err }, '❌ Redis Client Error'));
redisClient.on('connect', () => {
    logger.info('🔄 Connecting to Redis...');
});

(async () => {
    await redisClient.connect();
    logger.info('✅ Connected to Redis');
})();

export { redisClient, redisConnection };