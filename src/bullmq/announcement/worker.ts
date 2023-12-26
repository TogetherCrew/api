import { Job, Worker } from 'bullmq';
import { REDIS_CONNECTOR, announcementQueueName } from '../config';
import path from 'path';


let worker: Worker
const processorPath = path.join(__dirname, 'processor.js');

export const setUpAnnouncementWorker = () => {
    worker = new Worker(announcementQueueName, processorPath, {
      connection: REDIS_CONNECTOR,
      autorun: true,
    });

    worker.on('active', (job) => {
      console.debug(`Processing job with id ${job.id}`);
    });
  
    worker.on('completed', (job, returnValue) => {
      console.debug(`Completed job with id ${job.id}`, returnValue);
    });
  
    worker.on('error', (failedReason) => {
      console.error(`Job encountered an error`, failedReason);
    });
};
