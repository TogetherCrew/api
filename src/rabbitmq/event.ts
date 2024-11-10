import { Event } from '@togethercrew.dev/tc-messagebroker';
import { announcementController } from '../controllers';
import rabbitMQClient from './index';
import handleEngagementTokenIssued from './handlers/engagementTokenIssued.handler';
announcementController;
export function initializeHandlers(): void {
  rabbitMQClient.registerHandler(
    Event.SERVER_API.ANNOUNCEMENT_SAFETY_MESSAGE,
    announcementController.onSafetyMessageEvent,
  );
  rabbitMQClient.registerHandler(Event.SERVER_API.EngagementTokenIssued, handleEngagementTokenIssued);
}
