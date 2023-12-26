import { Queue, Job } from 'bullmq';
import { DEFAULT_REMOVE_CONFIG, REDIS_CONNECTOR, announcementQueueName } from '../../config/bullmq';
import { setUpAnnouncementWorker } from './worker';

export const announcementQueue = new Queue(announcementQueueName, {
	connection: REDIS_CONNECTOR,
});
setUpAnnouncementWorker();

export async function addJobToAnnouncementQueue<T>(jobName: string, data: T, executionTime: Date): Promise<Job<T>> {
    const now = new Date();
    const delay = executionTime.getTime() - now.getTime();

	return announcementQueue.add(jobName, data, {...DEFAULT_REMOVE_CONFIG, delay: delay});
}

export async function removeJobFromAnnouncementQueue(jobId: string): Promise<void> {
    const job = await announcementQueue.getJob(jobId);
    if (job) {
        await job.remove();
    }
}

