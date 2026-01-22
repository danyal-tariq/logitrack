import { Worker } from 'bullmq';
import pool from '../config/db';
import type { LocationUpdate } from '../models/vehicle';
import logger from '../config/logger';
import { redisConnection } from '../config/redis';

const locationWorker = new Worker('locationQueue', async job => {
    const { vehicleId, lat, lng, speed, status } = job.data as LocationUpdate;
    // PostgreSQL Write
    const query = `
      INSERT INTO vehicle_locations (vehicle_id, location, speed)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)
    `;
    await pool.query(query, [vehicleId, lng, lat, speed]);

    // Update current status
    await pool.query(
        'UPDATE vehicles SET last_updated = NOW(), status = $1 WHERE id = $2',
        [status, vehicleId]
    );
    logger.info({ vehicleId }, '🚚 Location stored in DB');
}, {
    connection: redisConnection,
})

locationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, '✅ Location job completed');
});
locationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, '❌ Location job failed');
});

export { locationWorker };