import { Queue } from 'bullmq';
import type { LocationUpdate } from '../models/vehicle';
import { redisConnection } from '../config/redis';

const locationQueue = new Queue('locationQueue', {
    connection: redisConnection,
});


const addLocationJob = async (data: LocationUpdate) => {
    await locationQueue.add('location-updates', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    });
}

export { locationQueue, addLocationJob };