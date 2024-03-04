import { Job } from 'bullmq';
import { announcementService } from '../../services';

const jobProcessor = async (job: Job) => {
  await job.log(`Started processing job with id ${job.id}`);

  return announcementService.bullMQTriggeredAnnouncement(job);
};

export default jobProcessor;
