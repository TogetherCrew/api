import { Client, ScheduleHandle, ScheduleOverlapPolicy } from '@temporalio/client';
import { TemporalCoreService } from './core.service';
import config from 'src/config';

class TemporalDiscourseService extends TemporalCoreService {
  public async createSchedule(platformId: string, endpoint: string): Promise<ScheduleHandle> {
    const client: Client = await this.getClient();

    return client.schedule.create({
      action: {
        type: 'startWorkflow',
        workflowType: 'DiscourseExtractWorkflow',
        args: [endpoint], // TODO add platformId
        taskQueue: config.temporal.heavyQueue,
      },
      scheduleId: `discourse/${encodeURIComponent(endpoint)}`,
      policies: {
        catchupWindow: '1 day',
        overlap: ScheduleOverlapPolicy.SKIP,
      },
      spec: {
        intervals: [{ every: '1d' }],
      },
    });
  }
}

export default new TemporalDiscourseService();
