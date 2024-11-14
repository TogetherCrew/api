import fetch from 'node-fetch';
import config from '../config';
import { ApiError } from '../utils';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'OciService' });

async function getProfiles(address: string, chainId: number) {
  try {
    logger.debug(`${config.ociBackendURL}/oci/profiles/${chainId}/${address}`);
    const response = await fetch(`${config.ociBackendURL}/api/v1/oci/profiles/${chainId}/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      throw new Error(errorResponse);
    }
  } catch (error: any) {
    logger.error(error, 'Failed to get profiles from oci backend');
    throw new ApiError(590, 'Failed to get profiles from oci backend ');
  }
}

export default {
  getProfiles,
};
