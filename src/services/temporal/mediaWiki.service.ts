import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Client } from '@temporalio/client';

import parentLogger from '../../config/logger';
import { queues } from './configs/temporal.config';
import { TemporalCoreService } from './core.service';

const logger = parentLogger.child({ module: 'MediaWikiTemporalService' });

class TemporalMediaWikiService extends TemporalCoreService {
  public async executeWorkflow(platformId: Types.ObjectId) {
    const client: Client = await this.getClient();
    const payload = platformId;
    try {
      client.workflow.execute('MediaWikiETLWorkflow', {
        taskQueue: queues.TEMPORAL_QUEUE_PYTHON_HEAVY,
        args: [payload],
        workflowId: `api:mediawikietl:${platformId}`,
      });
    } catch (error) {
      logger.error(`Failed to trigger MediaWiki workflow: ${(error as Error).message}`);
      throw new Error(`Failed to trigger MediaWiki workflow: ${(error as Error).message}`);
    }
  }

  public async terminateWorkflow(platformId: Types.ObjectId): Promise<void> {
    const client: Client = await this.getClient();
    try {
      client.workflow.getHandle(`api:mediawikietl:${platformId}`).terminate();
    } catch (error) {
      logger.error(`Failed to terminate MediaWiki workflow: ${(error as Error).message}`);
      throw new Error(`Failed to terminate MediaWiki workflow: ${(error as Error).message}`);
    }
  }
}

export default new TemporalMediaWikiService();
