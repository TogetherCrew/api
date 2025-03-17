import { Client } from '@temporalio/client';

import parentLogger from '../../config/logger';
import { queues } from './configs/temporal.config';
import { TemporalCoreService } from './core.service';

const logger = parentLogger.child({ module: 'HivemindTemporalService' });

interface HivemindPayload {
  community_id: string;
  query: string;
  enable_answer_skipping: boolean;
}

class HivemindTemporalService extends TemporalCoreService {
  /**
   * Triggers the AgenticHivemindTemporalWorkflow with the given payload.
   *
   * Environment variables used:
   * - TEMPORAL_TASK_QUEUE: Task queue for the agent service (e.g. "HIVEMIND_AGENT_QUEUE").
   * - TEMPORAL_HIVEMIND_TASK_QUEUE: Task queue that hivemind-bot is on (e.g. "TEMPORAL_QUEUE_PYTHON_HEAVY").
   *
   * @param communityId - The community identifier.
   * @param query - The query to process.
   * @param enableAnswerSkipping - Flag indicating if answer skipping is enabled.
   * @returns The workflow ID of the started workflow.
   */
  public async triggerWorkflow(communityId: string, query: string, enableAnswerSkipping: boolean) {
    const client: Client = await this.getClient();

    const payload: HivemindPayload = {
      community_id: communityId,
      query: query,
      enable_answer_skipping: enableAnswerSkipping,
    };
    try {
      const workflowHandle = await client.workflow.execute('AgenticHivemindTemporalWorkflow', {
        taskQueue: queues.HIVEMIND_AGENT_QUEUE,
        args: [payload],
        workflowId: `api:agnet-${communityId}`,
      });
      logger.info(`Started Hivemind workflow with ID: ${workflowHandle}`);
      return workflowHandle;
    } catch (error) {
      logger.error(`Failed to trigger Hivemind workflow: ${(error as Error).message}`);
      throw new Error(`Failed to trigger Hivemind workflow: ${(error as Error).message}`);
    }
  }
}

export default new HivemindTemporalService();
