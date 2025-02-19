import { CalendarSpec, Client, ScheduleHandle, ScheduleOverlapPolicy } from '@temporalio/client';

import config from '../../config';
import parentLogger from '../../config/logger';
import { TemporalCoreService } from './core.service';

const logger = parentLogger.child({ module: 'DiscourseTemporalService' });

class TemporalDiscourseService extends TemporalCoreService {
  public async createSchedule(platformId: string, endpoint: string): Promise<ScheduleHandle> {
    const initiationTime = new Date();
    const hour = initiationTime.getUTCHours();
    const minute = initiationTime.getUTCMinutes();

    const calendarSpec: CalendarSpec = {
      hour,
      minute,
      comment: `Daily schedule at ${hour}:${minute} UTC`,
    };

    try {
      const client: Client = await this.getClient();
      return client.schedule.create({
        action: {
          type: 'startWorkflow',
          workflowType: 'DiscourseExtractWorkflow',
          args: [{ endpoint, platformId }],
          taskQueue: config.temporal.heavyQueue,
        },
        scheduleId: `discourse/${encodeURIComponent(endpoint)}`,
        policies: {
          catchupWindow: '1 day',
          overlap: ScheduleOverlapPolicy.SKIP,
        },
        spec: {
          calendars: [calendarSpec],
        },
      });
    } catch (error) {
      throw new Error(`Failed to create Temporal schedule: ${(error as Error).message}`);
    }
  }

  public async pauseSchedule(scheduleId: string): Promise<void> {
    const client: Client = await this.getClient();
    const handle = client.schedule.getHandle(scheduleId);
    await handle.pause();
  }

  public async deleteSchedule(scheduleId: string): Promise<void> {
    const client: Client = await this.getClient();
    const handle = client.schedule.getHandle(scheduleId);
    await handle.delete();
  }
}

export default new TemporalDiscourseService();
