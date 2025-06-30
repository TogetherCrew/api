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
    const payload = {
      platform_id: platformId,
    };
    try {
      const workflowHandle = await client.workflow.execute('MediaWikiETLWorkflow', {
        taskQueue: queues.TEMPORAL_QUEUE_PYTHON_HEAVY,
        args: [payload],
        workflowId: `mediawiki/${platformId}/${uuidv4()}`,
      });
      logger.info(`Started MediaWiki workflow with ID: ${workflowHandle}`);
      return workflowHandle;
    } catch (error) {
      logger.error(`Failed to trigger MediaWiki workflow: ${(error as Error).message}`);
      throw new Error(`Failed to trigger MediaWiki workflow: ${(error as Error).message}`);
    }
  }

  public async terminateWorkflow(workflowId: string): Promise<void> {
    const client: Client = await this.getClient();
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();
    if (description.status.name !== 'TERMINATED' && description.status.name !== 'COMPLETED') {
      await handle.terminate('Terminated due to schedule deletion');
    }
  }
}

export default new TemporalMediaWikiService();
