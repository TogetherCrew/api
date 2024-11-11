// rabbitMQClient.ts
import RabbitMQ, { Queue } from '@togethercrew.dev/tc-messagebroker';
import config from '../config';
import logger from '../config/logger';

export type EventHandler = (message: any) => void;

class RabbitMQClient {
  private static instance: RabbitMQClient;
  private url: string;
  private queue: Queue;
  private isConnected = false;

  private constructor(url: string, queue: Queue) {
    this.url = url;
    this.queue = queue;
  }

  public static getInstance(): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient(config.rabbitMQ.url, Queue.SERVER_API);
    }
    return RabbitMQClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    try {
      await RabbitMQ.connect(this.url, this.queue);
      this.isConnected = true;
      logger.info({ queue: this.queue }, 'Connected to RabbitMQ!');
    } catch (error) {
      logger.fatal({ queue: this.queue, error }, 'Failed to connect to RabbitMQ!');
      throw error;
    }
  }

  public registerHandler(event: string, handler: EventHandler): void {
    RabbitMQ.onEvent(event, handler);
    logger.info({ event }, `Handler registered for event: ${event}`);
  }
}

export default RabbitMQClient.getInstance();
