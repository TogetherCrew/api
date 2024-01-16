import { Worker } from 'bullmq';
import { REDIS_CONNECTOR, announcementQueueName } from '../../config/bullmq';
import processor from './processor';
import logger from '../../config/logger';

let worker: Worker

export const setUpAnnouncementWorker = () => {
  worker = new Worker(announcementQueueName, processor, {
    connection: REDIS_CONNECTOR,
    autorun: true,
  });

  worker.on('active', (job) => {
    logger.debug(`Processing job with id ${job.id}`);
  });

  worker.on('completed', (job, returnValue) => {
    logger.debug(`Completed job with id ${job.id}`, returnValue);
  });

  worker.on('error', (failedReason) => {
    logger.error(`Job encountered an error`, failedReason);
  });
};
