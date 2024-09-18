import { PlatformNames } from '@togethercrew.dev/db';

export const SUPPORTED_AIRFLOW_PLATFORMS = [PlatformNames.Discourse] as const;
export const AIRFLOW_PLATFORM_INFO = {
  [PlatformNames.Discourse]: {
    etl: 'discourse_analyzer_etl',
  },
};
