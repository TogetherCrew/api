import fetch from 'node-fetch';
import parentLogger from '../config/logger';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { IDiscourseDagConfig } from '../interfaces';
import { ApiError } from '../utils';
import httpStatus from 'http-status';
import { AIRFLOW_PLATFORM_INFO, SUPPORTED_AIRFLOW_PLATFORMS } from '../constants/airflow.constant';
import { SupportedAirflowPlatforms } from '../types/airflow.type';
import { HydratedDocument } from 'mongoose';
import { IPlatform, PlatformNames } from '@togethercrew.dev/db';
const logger = parentLogger.child({ module: 'airflowService' });

function getParamsByPlatform(platform: HydratedDocument<IPlatform>) {
  switch (platform.name) {
    case PlatformNames.Discourse: {
      return {
        platform_id: platform.id,
        id: platform.metadata?.id,
        period: platform.metadata?.period,
        recompute: false,
      };
    }
  }
}
/**
 * Triggers the DAG run in Apache Airflow.
 * @param {IDiscourseDagConfig} params - The parameters object.
 * @returns {Promise<any>} - The response from the Airflow DAG run trigger.
 */
async function triggerDag(platform: HydratedDocument<IPlatform>): Promise<any> {
  if (SUPPORTED_AIRFLOW_PLATFORMS.includes(platform.name as SupportedAirflowPlatforms)) {
    const params = getParamsByPlatform(platform);
    const dagRunId = uuidv4();
    const logicalDate = moment().add(1, 'minute').toISOString();
    const body = {
      dag_run_id: dagRunId,
      logical_date: logicalDate,
      conf: {
        ...params,
      },
      note: 'compute',
    };
    logger.info({ body }, 'Triggering DAG run');

    try {
      const auth = Buffer.from(`${config.airflow.username}:${config.airflow.password}`).toString('base64');
      const response = await fetch(
        `${config.airflow.baseURL}/api/v1/dags/${AIRFLOW_PLATFORM_INFO[platform.name as SupportedAirflowPlatforms].etl}/dagRuns`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, body }, 'Failed to trigger DAG run');
        throw new Error(`Airflow API call failed with status ${response.status}: ${error.message}`);
      } else {
        const data = await response.json();
        logger.info({ data }, 'Successfully triggered DAG run');
        return data;
      }
    } catch (error) {
      logger.error(
        error,
        `Failed to trigger DAG run for the ${AIRFLOW_PLATFORM_INFO[platform.name as SupportedAirflowPlatforms].etl}`,
      );
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to trigger DAG run for the');
    }
  } else {
    return;
  }
}

export default {
  triggerDag,
};
