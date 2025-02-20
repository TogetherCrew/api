import { Types } from 'mongoose';

import { CalendarSpec, Client, ScheduleHandle, ScheduleOverlapPolicy } from '@temporalio/client';

import parentLogger from '../../config/logger';
import { queues } from './configs/temporal.config';
import { TemporalCoreService } from './core.service';

const logger = parentLogger.child({ module: 'WebsiteTemporalService' });

class TemporalWebsiteService extends TemporalCoreService {
  public async createSchedule(platformId: Types.ObjectId): Promise<ScheduleHandle> {
    const initiationTime = new Date();
    const dayNumber = initiationTime.getUTCDay();
    const hour = initiationTime.getUTCHours();
    const minute = initiationTime.getUTCMinutes();
    const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
    const dayOfWeek = DAY_NAMES[dayNumber];

    const calendarSpec: CalendarSpec = {
      dayOfWeek,
      hour,
      minute,
      comment: `Weekly schedule for ${dayOfWeek} at ${hour}:${minute} UTC`,
    };

    try {
      const client: Client = await this.getClient();
      console.log('type', typeof platformId.toString());
      return client.schedule.create({
        scheduleId: `website/${platformId}`,
        spec: {
          calendars: [calendarSpec],
        },
        action: {
          type: 'startWorkflow',
          workflowType: 'WebsiteIngestionSchedulerWorkflow',
          args: [platformId.toString()],
          taskQueue: queues.pythonHeavy,
        },
        policies: {
          catchupWindow: '1 day',
          overlap: ScheduleOverlapPolicy.SKIP,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create or update website ingestion schedule: ${(error as Error).message}`);
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

export default new TemporalWebsiteService();
