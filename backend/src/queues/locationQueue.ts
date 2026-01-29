import { Queue } from 'bullmq';
import type { LocationUpdate } from '../models/vehicle';
import { redisConnection } from '../config/redis';

// Create queue with sensible defaults to avoid retaining large amounts of
// completed/failed job payloads in Redis (which can lead to memory growth
// under heavy enqueue rates like during load tests).
const locationQueue = new Queue('locationQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        // Remove job data from Redis once processed to free memory quickly
        removeOnComplete: true,
        removeOnFail: true,
    },
});


const addLocationJob = async (data: LocationUpdate) => {
    // Use the queue's default job options; pass a small payload and avoid
    // setting long-lived retention on job results.
    await locationQueue.add('location-updates', data);
}

export { locationQueue, addLocationJob };