// handlers/index.ts
import rabbitMQClient from '../index';
import { Event } from '@togethercrew.dev/tc-messagebroker';
import handleEngagementTokenIssued from './engagementTokenIssued.handler';

export default function initializeHandlers(): void {
  rabbitMQClient.registerHandler(Event.SERVER_API.EngagementTokenIssued, handleEngagementTokenIssued);
}
