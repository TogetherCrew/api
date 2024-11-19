import { Client, ScheduleHandle, ScheduleOverlapPolicy } from '@temporalio/client';
import { TemporalCoreService } from './core.service';
import config from '../../config';

class TemporalDiscourseService extends TemporalCoreService {
  public async createSchedule(platformId: string, endpoint: string): Promise<ScheduleHandle> {
    try {
      const client: Client = await this.getClient();
      return client.schedule.create({
        action: {
          type: 'startWorkflow',
          workflowType: 'DiscourseExtractWorkflow',
          args: [endpoint, platformId],
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
    } catch (error) {
      throw new Error(`Failed to create Temporal schedule: ${(error as Error).message}`);
    }
  }
}

export default new TemporalDiscourseService();
