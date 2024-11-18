import { Client, Connection } from '@temporalio/client';
import config from '../../config';

export class TemporalCoreService {
  private connection: Connection | undefined;
  private client: Client | undefined;

  private async createConnection(): Promise<Connection> {
    try {
      return await Connection.connect({ address: config.temporal.uri });
    } catch (error) {
      throw new Error(`Failed to connect to Temporal: ${(error as Error).message}`);
    }
  }

  protected async getClient(): Promise<Client> {
    if (!this.client) {
      if (!this.connection) {
        this.connection = await this.createConnection();
      }
      this.client = new Client({ connection: this.connection });
    }
    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
      this.client = undefined;
    }
  }
}
