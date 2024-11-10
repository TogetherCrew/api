import { moduleService } from '../../services';
import parentLogger from '../../config/logger';
import { Event, MBConnection } from '@togethercrew.dev/tc-messagebroker';
import { ModuleNames } from '@togethercrew.dev/db';

const logger = parentLogger.child({ module: `${Event.SERVER_API.EngagementTokenIssued}` });

export default async function handleEngagementTokenIssued(message: any): Promise<void> {
  try {
    logger.info(message, `processing handleEngagementTokenIssued event`);
    const data = message?.content.data;
    logger.debug(message);
    const dynamicNftModule = await moduleService.getModuleByFilter({
      name: ModuleNames.DynamicNft,
      'options.platforms.0.metadata.transactionHash': data.transactionHash,
    });
    logger.debug(dynamicNftModule);
    if (dynamicNftModule?.options?.platforms[0].metadata) {
      dynamicNftModule.options.platforms[0].metadata.tokenId = data.args.tokenId;
      dynamicNftModule.markModified('options.platforms.0.metadata');
      logger.debug(dynamicNftModule.options.platforms[0].metadata);
    }
    await dynamicNftModule?.save();
    logger.info(data, `handleEngagementTokenIssued event is processed`);
  } catch (err) {
    logger.error(message, 'handleEngagementTokenIssued Failed');
    logger.error(err, 'handleEngagementTokenIssued Failed');
  }
}
